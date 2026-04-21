const axios = require('axios');

async function run() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      username: 'testuser2',
      email: 'test2@test.com',
      phoneNumber: '0987654321',
      password: 'password'
    }).catch(async () => {
      return axios.post('http://localhost:5000/api/auth/login', {
        email: 'test2@test.com',
        password: 'password'
      });
    });

    const token = res.data.token;
    console.log('Login successful, token length:', token.length);

    console.log('Fetching stock data for AAPL...');
    await axios.get('http://localhost:5000/api/stocks/AAPL', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Searched AAPL');

    console.log('Fetching history...');
    const historyRes = await axios.get('http://localhost:5000/api/user/history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('History items:', historyRes.data.length);
    console.log(historyRes.data);

  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
