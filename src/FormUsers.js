import React, { useState } from 'react';
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
  Platform
} from 'react-native';
import { api } from './api';
import { signOut } from 'firebase/auth';
import { auth } from './FirebaseConnection';
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

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpa a mensagem de erro quando o usuário começa a digitar
    if (errorMessage) setErrorMessage("");
  };

  // Função para buscar o CEP utilizando a API
  async function handleSearchCep() {
    if (formData.cep.length !== 8) {
      setErrorMessage("CEP deve ter 8 caracteres");
      return;
    }

    setCepLoading(true);
    try {
      const data = await api.searchCep(formData.cep);
      setFormData(prev => ({
        ...prev,
        logradouro: data.logradouro,
        bairro: data.bairro
      }));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Não foi possível encontrar o CEP");
      console.log(error);
    } finally {
      setCepLoading(false);
    }
  }

  // Função para registrar um novo usuário
  async function handleRegister() {
    setFormSubmitted(true);
    
    // Valida todos os campos
    if (!formData.nome || !formData.idade || !formData.cargo || !formData.cep) {
      setErrorMessage("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      await api.registerUser(formData);
      
      // Mostra mensagem de sucesso e reseta o formulário
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
        navigation.navigate("UsersList");
      }, 1000);
      
    } catch (err) {
      setErrorMessage("Erro ao cadastrar usuário");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  // Função para logout
  async function handleLogout() {
    try {
      await signOut(auth);
      navigation.navigate('Login'); // Navega para tela de login após sair
    } catch (error) {
      console.log("Erro ao fazer logout:", error);
    }
  }

  // Verifica se um campo está vazio e se já tentou submeter o form
  const isFieldInvalid = (fieldName) => {
    return formSubmitted && !formData[fieldName];
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
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome completo <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  isFieldInvalid('nome') && styles.inputError
                ]}
                placeholder="Digite seu nome completo"
                value={formData.nome}
                onChangeText={(text) => updateFormField('nome', text)}
              />
              {isFieldInvalid('nome') && (
                <Text style={styles.fieldError}>Nome é obrigatório</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Idade <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  isFieldInvalid('idade') && styles.inputError
                ]}
                placeholder="Digite sua idade"
                value={formData.idade}
                onChangeText={(text) => updateFormField('idade', text)}
                keyboardType="numeric"
                maxLength={3}
              />
              {isFieldInvalid('idade') && (
                <Text style={styles.fieldError}>Idade é obrigatória</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cargo <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  isFieldInvalid('cargo') && styles.inputError
                ]}
                placeholder="Digite seu cargo"
                value={formData.cargo}
                onChangeText={(text) => updateFormField('cargo', text)}
              />
              {isFieldInvalid('cargo') && (
                <Text style={styles.fieldError}>Cargo é obrigatório</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CEP <Text style={styles.required}>*</Text></Text>
              <View style={styles.cepContainer}>
                <TextInput
                  style={[
                    styles.cepInput,
                    isFieldInvalid('cep') && styles.inputError
                  ]}
                  placeholder="Digite apenas números"
                  value={formData.cep}
                  onChangeText={(text) => updateFormField('cep', text)}
                  keyboardType="numeric"
                  maxLength={8}
                />
                <TouchableOpacity 
                  style={styles.cepButton} 
                  onPress={handleSearchCep}
                  disabled={cepLoading || formData.cep.length !== 8}
                >
                  {cepLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.cepButtonText}>Buscar</Text>
                  )}
                </TouchableOpacity>
              </View>
              {isFieldInvalid('cep') && (
                <Text style={styles.fieldError}>CEP é obrigatório</Text>
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
            
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleRegister}
              disabled={loading}
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
  cepButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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