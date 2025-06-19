document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Адрес кошелька вашего БОТА, куда будут приходить платежи
    const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6"; 

    // Инициализируем TonConnectUI
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://dmmrk.github.io/dice-pay-app/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    const paymentForm = document.getElementById('payment-form');
    const sendTxButton = document.getElementById('send-tx-button');
    const amountInput = document.getElementById('amount-input');

    // Показываем/скрываем форму оплаты в зависимости от статуса подключения кошелька
    tonConnectUI.onStatusChange(wallet => {
        paymentForm.classList.toggle('hidden', !wallet);
    });

    // Обрабатываем нажатие на кнопку "Пополнить"
    sendTxButton.addEventListener('click', async () => {
        if (!tonConnectUI.connected) {
            alert('Кошелек не подключен. Пожалуйста, сначала подключите кошелек.');
            return;
        }

        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0.01) {
            alert('Пожалуйста, введите сумму больше 0.01 TON.');
            return;
        }

        const amountNano = Math.floor(amount * 1e9).toString();
        const userId = tg.initDataUnsafe?.user?.id;

        if (!userId) {
            alert("Критическая ошибка: не удалось получить ваш Telegram ID.");
            return;
        }

        const comment = `dep_${userId}`;
        
        // Формируем простую транзакцию. TON Connect сам упакует комментарий.
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
            messages: [
                {
                    address: BOT_WALLET_ADDRESS,
                    amount: amountNano,
                    payload: comment // Передаем комментарий как простой текст
                }
            ]
        };

        try {
            await tonConnectUI.sendTransaction(transaction);
            tg.close();
        } catch (err) {
            console.error("Ошибка при отправке транзакции:", err);
        }
    });
});
