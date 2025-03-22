
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { db } from './FirebaseConnection'
import { deleteDoc, doc } from 'firebase/firestore'

export function UsersList({ data, handleEdit }){

  async function handleDeleteItem(){ 
    const docRef = doc(db, "users", data.id)
    await deleteDoc(docRef)
  }

  function handleEditUser(){
    handleEdit(data);
  }


  return(
    <View style={styles.container}>
      <Text style={styles.item}>Nome: {data.nome}</Text>
      <Text style={styles.item}>Idade: {data.idade}</Text>
      <Text style={styles.item}>Cargo: {data.cargo}</Text>

      <TouchableOpacity style={styles.button} onPress={handleDeleteItem}>
        <Text style={styles.buttonText}>Deletar usuario</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonEdit} onPress={handleEditUser}>
        <Text style={styles.buttonText}>Editar usuario</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f0f0",
  },
  formContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  label: {
    fontSize: 18,
    color: "#333",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonEdit: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonLogout: {
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  list: {
    marginTop: 20,
  },
  listItem: {
    backgroundColor: "#5C5E04FF",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.62,
    elevation: 4,
  },
  listItemText: {
    fontSize: 16,
    color: "#333",
  },
  toggleButton: {
    marginTop: 10,
    alignItems: "center",
  },
  toggleButtonText: {
    color: "#3498db",
    fontSize: 16,
    fontWeight: "bold",
  },
});