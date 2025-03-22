// api.js
export const api = {
    async registerUser(user) {
      try {
        const response = await fetch('https://sua-api.com/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
        });
  
        if (!response.ok) {
          throw new Error('Erro ao registrar usuário');
        }
  
        return await response.json();
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  
    async searchCep(cep) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/25812340/json/`);
        const data = await response.json();
  
        if (data.erro) {
          throw new Error('CEP não encontrado.');
        }
  
        return data;
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  };
  