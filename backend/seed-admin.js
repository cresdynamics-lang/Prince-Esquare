const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) => new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
});

const askHidden = (question) => new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let value = '';

    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (char) => {
        if (char === '\u0003') {
            stdout.write('\n');
            process.exit(130);
        }

        if (char === '\r' || char === '\n') {
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener('data', onData);
            stdout.write('\n');
            resolve(value);
            return;
        }

        if (char === '\u007f') {
            value = value.slice(0, -1);
            return;
        }

        value += char;
    };

    stdin.on('data', onData);
});

const getArgValue = (name) => {
    const prefix = `--${name}=`;
    const arg = process.argv.find((item) => item.startsWith(prefix));
    return arg ? arg.slice(prefix.length).trim() : '';
};

const isYes = (answer) => ['y', 'yes'].includes(answer.toLowerCase());

async function getAdminDetails() {
    const envEmail = process.env.ADMIN_EMAIL || '';
    const envPassword = process.env.ADMIN_PASSWORD || '';
    const envName = process.env.ADMIN_NAME || '';

    const name = getArgValue('name') || envName || await ask('Admin name: ');
    const email = getArgValue('email') || envEmail || await ask('Admin email: ');
    const password = getArgValue('password') || envPassword || await askHidden('Admin password: ');

    if (!name) {
        throw new Error('Admin name is required.');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('A valid admin email is required.');
    }

    if (!password || password.length < 8) {
        throw new Error('Admin password must be at least 8 characters long.');
    }

    return { name, email: email.toLowerCase(), password };
}

async function createAdmin() {
    try {
        const { name, email, password } = await getAdminDetails();
        const existing = await db.query('SELECT id, role FROM users WHERE email = $1', [email]);
        const hashedPassword = await bcrypt.hash(password, 10);

        if (existing.rows.length > 0) {
            const user = existing.rows[0];

            if (user.role === 'admin') {
                const updatePassword = await ask('Admin already exists. Update the password? (y/N): ');

                if (!isYes(updatePassword)) {
                    console.log('No changes made.');
                    return;
                }
            }

            await db.query(
                `UPDATE users
                 SET name = $1, password = $2, role = 'admin', is_verified = TRUE, updated_at = CURRENT_TIMESTAMP
                 WHERE email = $3`,
                [name, hashedPassword, email]
            );

            console.log(`Admin credentials updated for ${email}.`);
            return;
        }

        await db.query(
            `INSERT INTO users (name, email, password, role, is_verified)
             VALUES ($1, $2, $3, 'admin', TRUE)`,
            [name, email, hashedPassword]
        );

        console.log(`Admin user created for ${email}.`);
    } finally {
        rl.close();
        await db.pool.end();
    }
}

createAdmin().catch((error) => {
    console.error('Failed to create admin credentials:', error.message);
    process.exit(1);
});
