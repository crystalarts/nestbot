const axios = require('axios');

async function checkStatus(domains) {
    const results = [];

    for (const domain of domains) {
        try {
            const response = await axios.get(domain.url, { timeout: 10000 });

            if (response.status === 200) {
                results.push({ domain: domain.name, status: 'working', statusCode: response.status });
            } else {
                results.push({ domain: domain.name, status: 'notWorking', statusCode: response.status });
            }
        } catch (error) {
            let errorMessage = '';
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Przekroczono czas rządania.';
            } else if (error.code === 'ENOTFOUND') {
                errorMessage = 'Adres URL nie został znaleziony.';
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Połączenie zostało odrzucone.';
            } else if (error.code === 'ECONNRESET') {
                errorMessage = 'Połączenie zostało zresetowane.';
            } else {
                errorMessage = error.message;
            }
            results.push({ domain: domain.name, status: 'error', error: errorMessage });
        }
    }

    for (const domain of domains) {
        const found = results.some(result => result.domain === domain.name);
        if (!found) {
            results.push({ domain: domain.name, status: 'error', error: 'Nie można było sprawdzić statusu' });
        }
    }

    return results;
}

module.exports = { checkStatus };
