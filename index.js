const TelegramBot = require('node-telegram-bot-api');

// Replace with your Telegram Bot Token
const token = '8151189719:AAFBBICxhlQW1bDsGn8YgZR5HvpCsUNW8wg';
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

// Utility function to pad numbers
function pad(n, width = 2) {
    return n.toString().padStart(width, '0');
}

// Calculate the current period number (locked base date: June 2, 2025)
function fetchPeriodNumber() {
    try {
        const now = new Date();
        const baseDate = new Date(2025, 5, 2, 0, 0, 0); // Locked to June 2, 2025
        const baseRoundNumber = 9671;
        const diffMinutes = Math.floor((now - baseDate) / 60000);
        const currentRoundNumber = baseRoundNumber + diffMinutes;
        const year = baseDate.getFullYear();
        const month = pad(baseDate.getMonth() + 1);
        const day = pad(baseDate.getDate());
        const round = pad(currentRoundNumber, 5);
        const systemPrefix = "1000";
        return `${year}${month}${day}${systemPrefix}${round}`;
    } catch (error) {
        console.error('Error calculating period:', error.message);
        return 'Unknown Period';
    }
}

// Generate deterministic numbers from the period number
function generateNumbersFromPeriod(period) {
    try {
        const seed = parseInt(period.slice(-5)); // Use last 5 digits of period (the round number)
        const numbers = [];
        let currentSeed = seed;

        for (let i = 0; i < 3; i++) {
            currentSeed = (currentSeed * 9301 + 49297) % 233280; // Linear congruential generator
            numbers.push(Math.floor((currentSeed / 233280) * 10)); // Map to 0-9
        }
        return numbers;
    } catch (error) {
        throw new Error(`Error generating numbers from period: ${error.message}`);
    }
}

// Prediction methods (using deterministic numbers)
function matrix(inputs) {
    try {
        if (!Array.isArray(inputs) || inputs.length !== 3 || inputs.some(num => isNaN(num) || num < 0 || num > 9)) {
            throw new Error('Invalid input for Matrix prediction: Must be an array of 3 numbers between 0 and 9');
        }
        const sum = inputs.reduce((a, b) => a + b, 0);
        return sum % 10;
    } catch (error) {
        throw new Error(`Matrix prediction failed: ${error.message}`);
    }
}

function piBased(inputs) {
    try {
        if (!Array.isArray(inputs) || inputs.length !== 3 || inputs.some(num => isNaN(num) || num < 0 || num > 9)) {
            throw new Error('Invalid input for Pi-based prediction: Must be an array of 3 numbers between 0 and 9');
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

// Telegram Bot Commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (msg.from.id === bot.getMe().id) return; // Prevent bot from responding to itself

    const keyboard = {
        reply_markup: {
            keyboard: [
                ['Input Manually Numbers Prediction'],
                ['Automatically Prediction']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    bot.sendMessage(chatId, 'Welcome to Black and White KHNDY PREDICTION Bot!\n\nChoose an option below:', keyboard);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (msg.from.id === bot.getMe().id) return; // Prevent bot from responding to itself

    const state = userStates.get(chatId);

    if (text === 'Input Manually Numbers Prediction') {
        userStates.set(chatId, 'awaiting_manual_numbers');
        bot.sendMessage(chatId, 'add 3 manually numbers as\n\n1) ...\n2) ...\n3) ...\n\nCopy it and in place of ... Replace with manual numbers and send it to bot');
        return;
    }

    if (text === 'Automatically Prediction') {
        try {
            const period = fetchPeriodNumber();
            const numbers = generateNumbersFromPeriod(period); // Deterministic numbers based on period
            const piPrediction = piBased(numbers);
            const piResult = formatAutoPrediction(piPrediction);

            const message = `
*Automatic Prediction Result*

**Period Number:** ${period}

*Prediction:*
Signal: ${piResult.bigSmall}
Color: ${piResult.color}
            `;
            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (error) {
            bot.sendMessage(chatId, `Error making automatic prediction: ${error.message}. Please try again.`);
            console.error('Automatic prediction error:', error.message);
        }
        return;
    }

    if (state === 'awaiting_manual_numbers') {
        // Parse the user's message
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const numbers = lines.map(line => {
            const match = line.match(/\d+\)\s*(\d+)/);
            return match ? parseInt(match[1]) : null;
        }).filter(num => num !== null);

        if (numbers.length !== 3 || numbers.some(num => isNaN(num) || num < 0 || num > 9)) {
            bot.sendMessage(chatId, 'Invalid format or numbers. Please use the format:\n\n1) 1\n2) 2\n3) 3\n\nNumbers must be between 0 and 9.');
            return;
        }

        try {
            const period = fetchPeriodNumber();
            const deterministicNumbers = generateNumbersFromPeriod(period); // Use period-based numbers
            const matrixPrediction = matrix(deterministicNumbers);
            const piPrediction = piBased(deterministicNumbers);
            const matrixResult = formatPrediction(matrixPrediction);
            const piResult = formatPrediction(piPrediction);

            const message = `
*Prediction Result*

**Input Numbers (User Provided):** ${numbers.join(', ')}
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
        } catch (error) {
            bot.sendMessage(chatId, `Error making prediction: ${error.message}. Please try again.`);
            console.error('Prediction error:', error.message);
            userStates.delete(chatId);
        }
        return;
    }

    if (text.startsWith('/')) return; // Ignore other commands

    bot.sendMessage(chatId, 'Please choose an option:\n- Input Manually Numbers Prediction\n- Automatically Prediction');
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error.message);
});

console.log('Telegram bot is running on Render...');
