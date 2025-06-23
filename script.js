document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    if (!tg.initData) {
        document.getElementById('app').innerHTML = '<h1>Ошибка</h1><p>Это приложение можно открыть только внутри Telegram.</p>';
        return;
    }

    tg.ready();
    tg.expand();

    const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6"; 

    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://dmmrk.github.io/dice-pay-app/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    const paymentForm = document.getElementById('payment-form');
    const sendTxButton = document.getElementById('send-tx-button');
    const amountInput = document.getElementById('amount-input');
    const statusMessage = document.getElementById('status-message');

    tonConnectUI.onStatusChange(wallet => {
        paymentForm.classList.toggle('hidden', !wallet);
    });

    async function pollStatus(comment) {
        try {
            const response = await fetch(`https://dicearena.herokuapp.com/api/deposit-status?comment=${comment}`);
            const data = await response.json();

            if (data.status === 'confirmed') {
                statusMessage.innerText = `✅ Платёж на ${data.amount} TON получен! Окно закроется через 3 секунды.`;
                setTimeout(() => tg.close(), 3000);
            } else {
                // Если статус 'pending', продолжаем опрос через 5 секунд
                setTimeout(() => pollStatus(comment), 5000);
            }
        } catch (e) {
            console.error("Ошибка опроса статуса:", e);
            setTimeout(() => pollStatus(comment), 5000); // Повторяем в случае ошибки сети
        }
    }

    sendTxButton.addEventListener('click', async () => {
        const wallet = tonConnectUI.wallet;
        if (!wallet) {
            alert('Кошелек не подключен.');
            return;
        }

        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0.01) {
            alert('Введите сумму больше 0.01 TON.');
            return;
        }

        const amountNano = Math.floor(amount * 1e9).toString();
        const userId = tg.initDataUnsafe?.user?.id;
        if (!userId) {
            alert("Критическая ошибка: не удалось получить ваш Telegram ID.");
            return;
        }

        const comment = `dep_${userId}_${Date.now()}`;
        const payload = btoa(comment);

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{ address: BOT_WALLET_ADDRESS, amount: amountNano, payload: payload }]
        };

        try {
            const result = await tonConnectUI.sendTransaction(transaction);
            
            paymentForm.classList.add('hidden');
            document.getElementById('ton-connect-button').classList.add('hidden');
            statusMessage.classList.remove('hidden');
            statusMessage.innerText = '⏳ Транзакция отправлена. Проверяем поступление платежа в сети...';

            // Запускаем опрос статуса после успешной отправки
            pollStatus(comment);

        } catch (err) {
            console.error("Ошибка при отправке транзакции:", err);
            statusMessage.innerText = '❌ Ошибка при отправке. Попробуйте снова.';
            statusMessage.classList.remove('hidden');
        }
    });
});
