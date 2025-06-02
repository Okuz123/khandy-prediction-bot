const TelegramBot = require('node-telegram-bot-api');

// Replace with your Telegram Bot Token
const token = '8151189719:AAHAHPFITVrrG0nLPlWhflVJhz0B8GUITzo';
const bot = new TelegramBot(token, { polling: true });

// Store user states and input numbers
const userStates = new Map();
const userInputs = new Map();

// Pi digits for prediction
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

// Calculate the current period number (updated from HTML code)
async function fetchPeriodNumber() {
    try {
        const now = new Date();
        const baseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const baseRoundNumber = 9671; // Adjusted to match 11066 at 23:15
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

// Prediction methods
async function matrix(inputs) {
    const sum = inputs.reduce((a, b) => a + b, 0);
    return (sum % 10);
}

async function piBased(inputs) {
    const inputSum = inputs.reduce((a, b) => a + b, 0);
    const index = inputSum % PI_DIGITS.length;
    return parseInt(PI_DIGITS[index]);
}

// Format prediction result
function formatPrediction(number) {
    const bigSmall = number >= 0 && number <= 4 ? 'Small' : 'Big';
    const signal = number % 2 === 0 ? 'Even' : 'Odd';
    const color = signal === 'Even' ? 'Green 💚' : 'Red ♥️';
    return { number, bigSmall, color };
}

// Telegram Bot Commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome to Black and White KHNDY PREDICTION Bot!\n\nCommands:\n/predict - Make a prediction using Pi-based and Matrix methods');
});

bot.onText(/\/predict/, (msg) => {
    const chatId = msg.chat.id;
    userStates.set(chatId, 'awaiting_numbers');
    userInputs.set(chatId, []);
    bot.sendMessage(chatId, 'Please enter the last 3 numbers (one at a time, e.g., 1, then 2, then 3).');
});

bot.onText(/\/predictai/, async (msg) => {
    const chatId = msg.chat.id;
    const numbers = userInputs.get(chatId);

    if (!numbers || numbers.length !== 3) {
        bot.sendMessage(chatId, 'Error: Please start over with /predict and enter 3 numbers.');
        userStates.delete(chatId);
        userInputs.delete(chatId);
        return;
    }

    try {
        // Calculate predictions
        const matrixPrediction = await matrix(numbers);
        const piPrediction = await piBased(numbers);
        const matrixResult = formatPrediction(matrixPrediction);
        const piResult = formatPrediction(piPrediction);
        const period = await fetchPeriodNumber();

        const message = `
*Prediction Result*

**Input Numbers:** ${numbers.join(', ')}
**Period Number:** ${period}

*Matrix Prediction:*
Number: ${matrixResult.number}
Signal: ${matrixResult.bigSmall}
Color: ${matrixResult.color}

*Pi-Based Prediction:*
Number: ${piResult.number}
Signal: ${piResult.bigSmall}
Color: ${piResult.color}
        `;
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

        // Reset state
        userStates.delete(chatId);
        userInputs.delete(chatId);
    } catch (error) {
        bot.sendMessage(chatId, 'Error making prediction. Please try again.');
        console.error('Prediction error:', error);
        userStates.delete(chatId);
        userInputs.delete(chatId);
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text.startsWith('/')) return; // Ignore commands

    const state = userStates.get(chatId);

    if (state === 'awaiting_numbers') {
        const number = parseInt(text);
        if (isNaN(number) || number < 0 || number > 9) {
            bot.sendMessage(chatId, 'Please enter a valid number between 0 and 9.');
            return;
        }

        const numbers = userInputs.get(chatId);
        numbers.push(number);

        if (numbers.length < 3) {
            bot.sendMessage(chatId, `Number ${numbers.length} received: ${number}. Please enter the next number.`);
            userInputs.set(chatId, numbers);
        } else {
            userInputs.set(chatId, numbers);
            userStates.delete(chatId); // No need for further state
            bot.sendMessage(chatId, `Numbers received: ${numbers.join(', ')}. Tap the command below to get the prediction:\n\n/predictai`);
        }
    } else {
        bot.sendMessage(chatId, 'Please use /predict to start a prediction.');
    }
});

console.log('Telegram bot is running on Render...');
