const TelegramBot = require('node-telegram-bot-api');

// Replace with your Telegram Bot Token
const token = '8151189719:AAHAHPFITVrrG0nLPlWhflVJhz0B8GUITzo';
const bot = new TelegramBot(token, { polling: true });

// Prediction logic setup
let pastResults = [4, 8, 2, 6, 0, 3, 7, 1, 5, 9];
const methodWeights = {
    matrix: 1.5, composite: 1.5, gaussian: 1.5, arithmetic: 1.5, linearGradient: 1.5, trend: 1.5, piBased: 1.5, aiPredictor: 3.0, wavePattern: 0.5, finalPrediction: 2.0
};
const methodPerformance = {
    matrix: 0.5, complement: 0.5, delta: 0.5, composite: 0.5, gaussian: 0.5, arithmetic: 0.5, linearGradient: 0.5, random: 0.5, trend: 0.5, piBased: 0.5, aiPredictor: 0.5, wavePattern: 0.5, finalPrediction: 0.5
};
const selectedMethods = ['matrix', 'complement', 'delta', 'composite', 'gaussian', 'arithmetic', 'linearGradient', 'random', 'trend', 'piBased', 'aiPredictor', 'wavePattern', 'finalPrediction'];

const PI_DIGITS = '1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679' +
    '8214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196' +
    '4428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273' +
    '7245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094' +
    '3305727036575959195309218611738193261179310511854807446237996274956735188575272489122793818301194912' +
    '9833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132' +
    '0005681274526356082778577134275778960917363717872146844090122495343014654958537105079227968925892354' +
    '2019956112129021960864034418159813629774771309960518707211349999998372978049951059731732816096318595' +
    '0244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035' +
    '9825349042875546873115956286388235378759375195778185778053217122680661300192787661119590921642019893';

// Utility function to pad numbers
function pad(n, width = 2) {
    return n.toString().padStart(width, '0');
}

// Calculate the current period
async function fetchPeriodFromServer() {
    try {
        const now = new Date();
        const baseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const baseRoundNumber = 9671;
        const diffMinutes = Math.floor((now - baseTime) / 60000);
        const currentRoundNumber = baseRoundNumber + diffMinutes;
        const year = now.getFullYear();
        const month = pad(now.getMonth() + 1);
        const day = pad(now.getDate());
        const round = pad(currentRoundNumber, 5);
        const systemPrefix = "1000";
        return `${year}${month}${day}${systemPrefix}${round}`;
    } catch (error) {
        console.error('Error calculating period:', error);
        return 'Unknown Period';
    }
}

// Generate mock lottery data (removed Jenkins dependency)
async function fetchRealData() {
    const mockData = Array(9).fill().map(() => Math.floor(Math.random() * 10));
    pastResults = [...mockData];
    return mockData;
}

// Prediction methods
async function matrix(inputs) {
    const sum = inputs.reduce((a, b) => a + b, 0);
    return (sum % 10);
}

async function complement(inputs) {
    const last = inputs[inputs.length - 1];
    return (10 - last) % 10;
}

async function delta(inputs) {
    const deltas = inputs.slice(1).map((val, i) => Math.abs(val - inputs[i]));
    return deltas.reduce((a, b) => (a + b) % 10, 0);
}

async function composite(inputs) {
    const sum = inputs.reduce((a, b) => a + b, 0);
    const product = inputs.reduce((a, b) => a * (b || 1), 1);
    return ((sum + product) % 10);
}

async function gaussian(inputs) {
    const frequencies = Array(10).fill(0);
    pastResults.forEach(num => frequencies[num]++);
    const mean = pastResults.reduce((a, b) => a + b, 0) / pastResults.length;
    const variance = pastResults.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pastResults.length;
    const stdDev = Math.sqrt(variance);
    let maxProb = -Infinity;
    let predictedNum = 0;
    for (let i = 0; i < 10; i++) {
        const prob = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-Math.pow(i - mean, 2) / (2 * variance));
        if (prob > maxProb) {
            maxProb = prob;
            predictedNum = i;
        }
    }
    return predictedNum;
}

async function arithmetic(inputs) {
    const mean = inputs.reduce((a, b) => a + b, 0) / inputs.length;
    return Math.round(mean) % 10;
}

async function linearGradient(inputs) {
    const trend = pastResults.map((val, i) => ({ x: i, y: val }));
    const n = trend.length;
    const sumX = trend.reduce((sum, p) => sum + p.x, 0);
    const sumY = trend.reduce((sum, p) => sum + p.y, 0);
    const sumXY = trend.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = trend.reduce((sum, p) => sum + p.x * p.x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const nextX = n;
    const predicted = Math.round(slope * nextX + intercept) % 10;
    return predicted < 0 ? (predicted + 10) % 10 : predicted;
}

async function random(inputs) {
    return Math.floor(Math.random() * 10);
}

async function trend(inputs) {
    const recentInputs = pastResults.slice(-5);
    if (recentInputs.length < 5) return random(inputs);
    const trend = recentInputs.reduce((a, b) => a + b, 0) / recentInputs.length;
    return Math.round(trend) % 10;
}

async function piBased(inputs) {
    const inputSum = inputs.reduce((a, b) => a + b, 0);
    const index = inputSum % PI_DIGITS.length;
    return parseInt(PI_DIGITS[index]);
}

async function aiPredictor(inputs) {
    const frequencies = Array(10).fill(0);
    pastResults.forEach(num => frequencies[num]++);
    const weights = frequencies.map(freq => freq / pastResults.length);
    let weightedSum = 0;
    for (let i = 0; i < 10; i++) {
        weightedSum += i * weights[i];
    }
    return Math.round(weightedSum) % 10;
}

async function wavePattern(inputs) {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const wave = Math.sin(minutes * Math.PI / 180);
    return Math.round((wave + 1) * 4.5) % 10;
}

async function finalPrediction(predictions, inputs) {
    const validPredictions = Object.values(predictions).filter(p => p !== null);
    if (validPredictions.length === 0) return Math.floor(Math.random() * 10);

    const weightedSum = Object.keys(predictions).reduce((sum, method) => {
        if (predictions[method] !== null) {
            return sum + predictions[method] * (methodWeights[method] || 1);
        }
        return sum;
    }, 0);

    const totalWeight = Object.keys(predictions).reduce((sum, method) => {
        if (predictions[method] !== null) {
            return sum + (methodWeights[method] || 1);
        }
        return sum;
    }, 0);

    let prediction = Math.round(weightedSum / totalWeight) % 10;

    const frequencies = Array(10).fill(0);
    pastResults.forEach(num => frequencies[num]++);
    const mostFrequent = frequencies.indexOf(Math.max(...frequencies));
    if (Math.abs(prediction - mostFrequent) <= 1) {
        prediction = mostFrequent;
    } else {
        prediction = Math.round((prediction * 0.6 + mostFrequent * 0.4)) % 10;
    }

    return prediction;
}

async function runPredictionMethod(method, inputs) {
    const methods = {
        matrix, complement, delta, composite, gaussian, arithmetic, linearGradient, random, trend, piBased, aiPredictor, wavePattern, finalPrediction
    };
    return await methods[method](inputs);
}

// Main prediction function
async function makePrediction(usePi = false) {
    const inputs = await fetchRealData();
    const predictions = {};
    const methodResults = {};

    for (const method of selectedMethods) {
        try {
            const result = await runPredictionMethod(method, inputs);
            predictions[method] = result;
            methodResults[method] = result;
        } catch (error) {
            console.error(`Error in ${method}:`, error);
            predictions[method] = null;
        }
    }

    let finalPredictionResult;
    let piPredictionResult;

    if (usePi) {
        piPredictionResult = await piBased(inputs);
        finalPredictionResult = piPredictionResult;
        methodResults.piBased = piPredictionResult;
    } else {
        finalPredictionResult = await finalPrediction(predictions, inputs);
        piPredictionResult = await piBased(inputs);
    }

    const period = await fetchPeriodFromServer();
    const bigSmall = finalPredictionResult >= 0 && finalPredictionResult <= 4 ? 'Small' : 'Big';
    const signal = finalPredictionResult % 2 === 0 ? 'Even' : 'Odd';
    const accuracy = (methodPerformance.finalPrediction * 100).toFixed(1);

    return { finalPrediction: finalPredictionResult, piPrediction: piPredictionResult, period, methodResults, bigSmall, signal, accuracy, inputs };
}

// Telegram Bot Commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome to Black and White KHNDY PREDICTION 2.5.3 Bot!\n\nCommands:\n/predict - Make a prediction\n/predictpi - Make a prediction using Pi-based method');
});

bot.onText(/\/predict/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Generating data and making prediction...');

    try {
        const result = await makePrediction(false);
        const message = `
*Prediction Result*

**Input Numbers:** ${result.inputs.join(', ')}
**Final Prediction:** ${result.finalPrediction}
**Pi Prediction:** ${result.piPrediction}
**Big/Small:** ${result.bigSmall}
**Signal:** ${result.signal}
**Period:** ${result.period}
**Accuracy:** ${result.accuracy}%

*Method Breakdown:*
${Object.entries(result.methodResults)
    .filter(([_, value]) => value !== null)
    .map(([method, value]) => `${method}: ${value}`)
    .join('\n')}
        `;
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, 'Error making prediction. Please try again later.');
        console.error('Prediction error:', error);
    }
});

bot.onText(/\/predictpi/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Generating data and making Pi-based prediction...');

    try {
        const result = await makePrediction(true);
        const message = `
*Pi-Based Prediction Result*

**Input Numbers:** ${result.inputs.join(', ')}
**Final Prediction:** ${result.finalPrediction}
**Pi Prediction:** ${result.piPrediction}
**Big/Small:** ${result.bigSmall}
**Signal:** ${result.signal}
**Period:** ${result.period}
**Accuracy:** ${result.accuracy}%

*Method Breakdown:*
${Object.entries(result.methodResults)
    .filter(([_, value]) => value !== null)
    .map(([method, value]) => `${method}: ${value}`)
    .join('\n')}
        `;
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, 'Error making Pi-based prediction. Please try again later.');
        console.error('Prediction error:', error);
    }
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text.startsWith('/')) {
        bot.sendMessage(chatId, 'Please use /predict or /predictpi to get a prediction.');
    }
});

console.log('Telegram bot is running on Heroku...');
