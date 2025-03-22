import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  ActivityIndicator,
  Animated,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FormUsers } from './src/FormUsers';
import { auth } from './src/FirebaseConnection';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

export default function App() {
  // Estados
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  // Animações
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Ativar animações quando o componente montar
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();

    // Verificar o estado de autenticação
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser({
          email: user.email,
          uid: user.uid
        });
      } else {
        setAuthUser(null);
      }
      setLoading(false);
    });
    
    return unsub;
  }, []);

  // Funções de autenticação
  async function handleCreateUser() {
    if (!validateInputs()) return;
    
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setSuccess("Conta criada com sucesso!");
      setError("");
      
      // Limpar mensagem de sucesso após alguns segundos
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      handleAuthError(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin() {
    if (!validateInputs()) return;
    
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError("");
    } catch (err) {
      console.error(err);
      handleAuthError(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  // Funções auxiliares
  function validateInputs() {
    if (!email.trim()) {
      setError("Por favor, informe seu email");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, informe um email válido");
      return false;
    }
    
    if (!password.trim()) {
      setError("Por favor, informe sua senha");
      return false;
    }
    
    if (!isLoginMode && password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return false;
    }
    
    return true;
  }

  function handleAuthError(err) {
    let message = "Ocorreu um erro. Tente novamente.";
    
    if (err.code === "auth/email-already-in-use") {
      message = "Este email já está sendo utilizado";
    } else if (err.code === "auth/invalid-email") {
      message = "Email inválido";
    } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
      message = "Email ou senha incorretos";
    } else if (err.code === "auth/weak-password") {
      message = "A senha deve ter pelo menos 6 caracteres";
    } else if (err.code === "auth/network-request-failed") {
      message = "Erro de conexão. Verifique sua internet.";
    }
    
    setError(message);
  }

  // Renderização condicional para usuário autenticado
  if (authUser) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Feather name="log-out" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Bem-vindo, {authUser.email}</Text>
        </View>
        <FormUsers />
      </View>
    );
  }

  // Tela de login/cadastro
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        <Animated.View 
          style={[
            styles.formContainer,
            { 
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }] 
            }
          ]}
        >
          {/* Cabeçalho */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/5087/5087579.png" }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appTitle}>
              {isLoginMode ? "Acesso ao Sistema" : "Criar Nova Conta"}
            </Text>
            <Text style={styles.appSubtitle}>
              {isLoginMode 
                ? "Faça login para continuar"
                : "Preencha os dados para se cadastrar"}
            </Text>
          </View>

          {/* Mensagens de feedback */}
          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={18} color="#c53030" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          {success ? (
            <View style={styles.successContainer}>
              <Feather name="check-circle" size={18} color="#2f855a" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {/* Formulário */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#a0aec0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Seu email"
                placeholderTextColor="#a0aec0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#a0aec0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor="#a0aec0"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#a0aec0" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {isLoginMode && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          )}

          {/* Botões */}
          <TouchableOpacity
            style={[
              styles.button, 
              isLoginMode ? styles.loginButton : styles.registerButton,
              isSubmitting && styles.buttonDisabled
            ]}
            onPress={isLoginMode ? handleLogin : handleCreateUser}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {isLoginMode ? "Entrar" : "Cadastrar"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Alternância entre login e cadastro */}
          <View style={styles.switchModeContainer}>
            <Text style={styles.switchModeText}>
              {isLoginMode
                ? "Não tem uma conta?"
                : "Já tem uma conta?"}
            </Text>
            <TouchableOpacity onPress={() => {
              setIsLoginMode(!isLoginMode);
              setError("");
            }}>
              <Text style={styles.switchModeLink}>
                {isLoginMode ? "Criar conta" : "Fazer login"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divisor para redes sociais */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou continue com</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botões de login social */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Feather name="facebook" size={20} color="#3b5998" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Feather name="github" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Feather name="twitter" size={20} color="#1DA1F2" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Mostrar indicador de carregamento enquanto verifica autenticação */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4299e1" />
          </View>
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#4299e1",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  logoutButton: {
    padding: 8,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fed7d7",
  },
  errorText: {
    color: "#c53030",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fff4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#c6f6d5",
  },
  successText: {
    color: "#2f855a",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    height: 56,
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#2d3748",
  },
  passwordToggle: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: "#4299e1",
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButton: {
    backgroundColor: "#4299e1",
  },
  registerButton: {
    backgroundColor: "#48bb78",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  switchModeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  switchModeText: {
    color: "#718096",
    fontSize: 15,
  },
  switchModeLink: {
    color: "#4299e1",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    paddingHorizontal: 15,
    color: "#718096",
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});