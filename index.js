const TelegramBot = require('node-telegram-bot-api');

// Replace with your Telegram Bot Token
const token = '8151189719:AAEEp5rgTK9f4Hb2rEexCBwvBMeaIlgZfbA';
const bot = new TelegramBot(token, { polling: true });

// Store user states
const userStates = new Map();

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

// Prediction methods (using user-provided numbers)
function matrix(inputs) {
    try {
        if (!Array.isArray(inputs) || inputs.length !== 7 || inputs.some(num => isNaN(num) || num < 0 || num > 9)) {
            throw new Error('Invalid input for Matrix prediction: Must be an array of 7 numbers between 0 and 9');
        }
        const sum = inputs.reduce((a, b) => a + b, 0);
        return sum % 10;
    } catch (error) {
        throw new Error(`Matrix prediction failed: ${error.message}`);
    }
}

function piBased(inputs) {
    try {
        if (!Array.isArray(inputs) || inputs.length !== 7 || inputs.some(num => isNaN(num) || num < 0 || num > 9)) {
            throw new Error('Invalid input for Pi-based prediction: Must be an array of 7 numbers between 0 and 9');
        }
        const inputSum = inputs.reduce((a, b) => a + b, 0);
        const index = inputSum % PI_DIGITS.length;
        const result = parseInt(PI_DIGITS[index]);
        if (isNaN(result)) {
            throw new Error('Pi-based prediction returned invalid result');
        }
        return result;
    } catch (error) {
        throw new Error(`Pi-based prediction failed: ${error.message}`);
    }
}

// Format prediction result for manual input (with number)
function formatPrediction(number) {
    try {
        if (isNaN(number) || number < 0 || number > 9) {
            throw new Error('Invalid number for formatting: Must be between 0 and 9');
        }
        const bigSmall = number >= 0 && number <= 4 ? 'Small' : 'Big';
        const signal = number % 2 === 0 ? 'Even' : 'Odd';
        const color = signal === 'Even' ? 'Green 💚' : 'Red ♥️';
        return { number, bigSmall, color };
    } catch (error) {
        throw new Error(`Formatting prediction failed: ${error.message}`);
    }
}

// Format prediction result for automatic prediction (Big/Small and color only)
function formatAutoPrediction(number) {
    try {
        if (isNaN(number) || number < 0 || number > 9) {
            throw new Error('Invalid number for formatting: Must be between 0 and 9');
        }
        const bigSmall = number >= 0 && number <= 4 ? 'Small' : 'Big';
        const signal = number % 2 === 0 ? 'Even' : 'Odd';
        const color = signal === 'Even' ? 'Green 💚' : 'Red ♥️';
        return { bigSmall, color };
    } catch (error) {
        throw new Error(`Formatting auto prediction failed: ${error.message}`);
    }
}

// Generate random numbers for automatic prediction
function generateRandomNumbers(count) {
    const numbers = [];
    for (let i = 0; i < count; i++) {
        numbers.push(Math.floor(Math.random() * 10)); // Random number between 0 and 9
    }
    return numbers;
}

// Telegram Bot Commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.id === bot.getMe().id) return; // Prevent bot from responding to itself

    const keyboard = {
        reply_markup: {
            keyboard: [
                ['🔢 Input Manually Numbers Prediction'],
                ['🎲 Automatically Prediction'],
                ['📱 Open KHAND Prediction Hack']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    bot.sendMessage(chatId, '✨ **Welcome to Black and White KHANDY PREDICTION Bot!** ✨\n\n📩 Join our group for more updates: https://t.me/redenvlo\n\n👇 **Choose an option below:**', keyboard, { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (msg.from.id === bot.getMe().id) return; // Prevent bot from responding to itself

    const state = userStates.get(chatId);

    if (text === '🔢 Input Manually Numbers Prediction') {
        userStates.set(chatId, 'awaiting_manual_numbers');
        bot.sendMessage(chatId, '🔢 **Enter 7 numbers manually** in this format:\n\n1) ...\n2) ...\n3) ...\n4) ...\n5) ...\n6) ...\n7) ...\n\n📋 Copy the above format, replace "..." with numbers (0-9), and send it back to me! 😊', { parse_mode: 'Markdown' });
        return;
    }

    if (text === '🎲 Automatically Prediction') {
        try {
            const numbers = generateRandomNumbers(7); // Generate 7 random numbers
            const piPrediction = piBased(numbers);
            const piResult = formatAutoPrediction(piPrediction);

            const message = `
