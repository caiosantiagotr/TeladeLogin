import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { api } from './api';
import { signOut } from 'firebase/auth';
import { auth, db } from './FirebaseConnection'; // Certifique-se de importar db
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Importar funções do Firestore
import { MaterialIcons } from '@expo/vector-icons';

export function FormUsers({ navigation }) {
  const [formData, setFormData] = useState({
    nome: "",
    idade: "",
    cargo: "",
    cep: "",
    logradouro: "",
    bairro: ""
  });

  // Estado para controlar erros específicos de cada campo
  const [fieldErrors, setFieldErrors] = useState({
    nome: "",
    idade: "",
    cargo: "",
    cep: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Função para validar campo específico
  const validateField = (field, value) => {
    switch (field) {
      case 'nome':
        if (!value.trim()) return "Nome é obrigatório";
        if (value.trim().length < 3) return "Nome deve ter pelo menos 3 caracteres";
        if (!/^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ ]+$/.test(value)) 
          return "Nome deve conter apenas letras";
        return "";
        
      case 'idade':
        if (!value) return "Idade é obrigatória";
        const idade = parseInt(value);
        if (isNaN(idade)) return "Idade deve ser um número";
        if (idade < 18) return "Idade mínima é 18 anos";
        if (idade > 120) return "Idade inválida";
        return "";
        
      case 'cargo':
        if (!value.trim()) return "Cargo é obrigatório";
        if (value.trim().length < 2) return "Cargo deve ter pelo menos 2 caracteres";
        return "";
        
      case 'cep':
        if (!value) return "CEP é obrigatório";
        if (value.length !== 8) return "CEP deve ter 8 dígitos";
        if (!/^\d+$/.test(value)) return "CEP deve conter apenas números";
        return "";
        
      default:
        return "";
    }
  };

  // Função para atualizar campo e validar em tempo real
  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validar campo e atualizar erro específico
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    
    // Limpa a mensagem de erro geral quando o usuário começa a digitar
    if (errorMessage) setErrorMessage("");
  };

  // Função para validar formulário completo
  const validateForm = () => {
    let isValid = true;
    const newFieldErrors = {};
    
    // Validar cada campo
    Object.keys(formData).forEach(field => {
      if (field === 'logradouro' || field === 'bairro') return; // Estes são preenchidos automaticamente
      
      const error = validateField(field, formData[field]);
      newFieldErrors[field] = error;
      
      if (error) isValid = false;
    });
    
    setFieldErrors(newFieldErrors);
    return isValid;
  };

  // Função para buscar o CEP utilizando a API
  async function handleSearchCep() {
    // Validar CEP antes de buscar
    const cepError = validateField('cep', formData.cep);
    if (cepError) {
      setFieldErrors(prev => ({ ...prev, cep: cepError }));
      setErrorMessage(cepError);
      return;
    }

    setCepLoading(true);
    try {
      const data = await api.searchCep(formData.cep);
      if (!data || !data.logradouro) {
        setErrorMessage("CEP não encontrado ou inválido");
        setFieldErrors(prev => ({ ...prev, cep: "CEP não encontrado" }));
      } else {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro
        }));
        setErrorMessage("");
      }
    } catch (error) {
      console.log("Erro na busca do CEP:", error);
      setErrorMessage(`Erro ao buscar CEP: ${error.message || "Falha na conexão"}`);
      setFieldErrors(prev => ({ ...prev, cep: "Erro ao buscar CEP" }));
    } finally {
      setCepLoading(false);
    }
  }

  // Formatação dos dados antes de enviar ao Firebase
  const prepareDataForSubmission = () => {
    return {
      nome: formData.nome.trim(),
      idade: parseInt(formData.idade),
      cargo: formData.cargo.trim(),
      cep: formData.cep,
      logradouro: formData.logradouro,
      bairro: formData.bairro,
      createdAt: serverTimestamp() // Adiciona timestamp de criação
    };
  };

  // Função para registrar um novo usuário DIRETAMENTE no Firebase
  async function handleRegister() {
    setFormSubmitted(true);
    
    // Validar todos os campos
    if (!validateForm()) {
      setErrorMessage("Corrija os erros no formulário antes de continuar");
      return;
    }

    // Verifica se todos os campos obrigatórios estão presentes
    if (!formData.logradouro || !formData.bairro) {
      setErrorMessage("É necessário buscar um CEP válido antes de cadastrar");
      return;
    }

    setLoading(true);
    try {
      // Preparar dados para envio
      const dataToSubmit = prepareDataForSubmission();
      
      // SALVAR DIRETAMENTE NO FIREBASE
      // Referência à coleção 'usuarios' (ou o nome que você usa no Firebase)
      const usersCollection = collection(db, "usuarios");
      
      // Adicionar documento à coleção
      const docRef = await addDoc(usersCollection, dataToSubmit);
      
      console.log("Documento adicionado com ID: ", docRef.id);
      
      // Mostra mensagem de sucesso e reseta o formulário
      setSuccessMessage("Usuário cadastrado com sucesso!");
      setFormData({
        nome: "",
        idade: "",
        cargo: "",
        cep: "",
        logradouro: "",
        bairro: ""
      });
      setFormSubmitted(false);
      setErrorMessage("");
      
      // Mostra uma mensagem de sucesso temporária antes de navegar
      setTimeout(() => {
        setSuccessMessage("");
        navigation.navigate("UsersList");
      }, 2000);
      
    } catch (err) {
      console.log("Erro detalhado ao cadastrar no Firebase:", err);
      
      // Tratamento específico de erros do Firebase
      if (err.code === 'permission-denied') {
        setErrorMessage("Permissão negada. Verifique as regras do Firestore.");
      } else if (err.code === 'unavailable') {
        setErrorMessage("Serviço Firebase indisponível. Verifique sua conexão.");
      } else {
        setErrorMessage(`Erro ao cadastrar: ${err.message || "Erro desconhecido"}`);
      }
    } finally {
      setLoading(false);
    }
  }

  // Função para logout
  async function handleLogout() {
    Alert.alert(
      "Logout",
      "Tem certeza que deseja sair?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Sair",
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.navigate('Login');
            } catch (error) {
              console.log("Erro ao fazer logout:", error);
              Alert.alert("Erro", "Não foi possível fazer logout.");
            }
          }
        }
      ]
    );
  }

  // Função para limpar o formulário
  const handleClearForm = () => {
    Alert.alert(
      "Limpar formulário",
      "Deseja limpar todos os campos do formulário?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Limpar",
          onPress: () => {
            setFormData({
              nome: "",
              idade: "",
              cargo: "",
              cep: "",
              logradouro: "",
              bairro: ""
            });
            setFieldErrors({
              nome: "",
              idade: "",
              cargo: "",
              cep: ""
            });
            setErrorMessage("");
            setFormSubmitted(false);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cadastro de Usuário</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={20} color="#FF3B30" />
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              </View>
            ) : null}
            
            {successMessage ? (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={20} color="#34C759" />
                <Text style={styles.successMessage}>{successMessage}</Text>
              </View>
            ) : null}
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome completo <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  (formSubmitted && !formData.nome) || fieldErrors.nome ? styles.inputError : null
                ]}
                placeholder="Digite seu nome completo"
                value={formData.nome}
                onChangeText={(text) => updateFormField('nome', text)}
                maxLength={100}
              />
              {((formSubmitted && !formData.nome) || fieldErrors.nome) && (
                <Text style={styles.fieldError}>{fieldErrors.nome || "Nome é obrigatório"}</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Idade <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  (formSubmitted && !formData.idade) || fieldErrors.idade ? styles.inputError : null
                ]}
                placeholder="Digite sua idade"
                value={formData.idade}
                onChangeText={(text) => updateFormField('idade', text)}
                keyboardType="numeric"
                maxLength={3}
              />
              {((formSubmitted && !formData.idade) || fieldErrors.idade) && (
                <Text style={styles.fieldError}>{fieldErrors.idade || "Idade é obrigatória"}</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cargo <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  (formSubmitted && !formData.cargo) || fieldErrors.cargo ? styles.inputError : null
                ]}
                placeholder="Digite seu cargo"
                value={formData.cargo}
                onChangeText={(text) => updateFormField('cargo', text)}
                maxLength={50}
              />
              {((formSubmitted && !formData.cargo) || fieldErrors.cargo) && (
                <Text style={styles.fieldError}>{fieldErrors.cargo || "Cargo é obrigatório"}</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CEP <Text style={styles.required}>*</Text></Text>
              <View style={styles.cepContainer}>
                <TextInput
                  style={[
                    styles.cepInput,
                    (formSubmitted && !formData.cep) || fieldErrors.cep ? styles.inputError : null
                  ]}
                  placeholder="Digite apenas números"
                  value={formData.cep}
                  onChangeText={(text) => updateFormField('cep', text.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  maxLength={8}
                />
                <TouchableOpacity 
                  style={[
                    styles.cepButton,
                    (!formData.cep || formData.cep.length !== 8 || fieldErrors.cep) ? styles.buttonDisabled : null
                  ]} 
                  onPress={handleSearchCep}
                  disabled={cepLoading || !formData.cep || formData.cep.length !== 8 || !!fieldErrors.cep}
                >
                  {cepLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.cepButtonText}>Buscar</Text>
                  )}
                </TouchableOpacity>
              </View>
              {((formSubmitted && !formData.cep) || fieldErrors.cep) && (
                <Text style={styles.fieldError}>{fieldErrors.cep || "CEP é obrigatório"}</Text>
              )}
            </View>
            
            {formData.logradouro ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Logradouro</Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={formData.logradouro}
                    editable={false}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bairro</Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={formData.bairro}
                    editable={false}
                  />
                </View>
              </>
            ) : null}
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClearForm}
              >
                <MaterialIcons name="clear" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.clearButtonText}>Limpar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (loading || !formData.logradouro || !formData.bairro) ? styles.buttonDisabled : null
                ]} 
                onPress={handleRegister}
                disabled={loading || !formData.logradouro || !formData.bairro}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="person-add" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.submitButtonText}>Cadastrar Usuário</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.listButton}
            onPress={() => navigation.navigate('UsersList')}
          >
            <MaterialIcons name="list" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.listButtonText}>Ver Usuários Cadastrados</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  logoutButton: {
    padding: 8,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorMessage: {
    color: '#FF3B30',
    marginLeft: 6,
    fontSize: 14,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3FFF1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successMessage: {
    color: '#34C759',
    marginLeft: 6,
    fontSize: 14,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 6,
    fontWeight: '500',
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF8F8',
  },
  fieldError: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#666666',
  },
  cepContainer: {
    flexDirection: 'row',
  },
  cepInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    marginRight: 8,
  },
  cepButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
    opacity: 0.7,
  },
  cepButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  clearButton: {
    backgroundColor: '#8E8E93',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.48,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.48,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  listButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  listButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
