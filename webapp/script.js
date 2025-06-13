document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // ВАЖНО: Адрес кошелька вашего БОТА, куда будут приходить платежи
    const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6"; 

    // --- Правильная инициализация TON Connect ---
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        // Ссылка на ваш манифест. Убедитесь, что ник и имя репозитория верны.
        manifestUrl: 'https://dmmrk.github.io/dice-pay-app/webapp/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    const paymentForm = document.getElementById('payment-form');
    const sendTxButton = document.getElementById('send-tx-button');
    const amountInput = document.getElementById('amount-input');

    // Следим за состоянием подключения кошелька
    tonConnectUI.onStatusChange(wallet => {
        paymentForm.classList.toggle('hidden', !wallet);
    });

    // Обрабатываем нажатие на кнопку "Пополнить"
    sendTxButton.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            tg.showAlert('Пожалуйста, введите корректную сумму.');
            return;
        }

        // Формируем транзакцию
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 360, // 6 минут
            messages: [
                {
                    address: BOT_WALLET_ADDRESS,
                    amount: (amount * 1000000000).toString(), // Сумма в наноТОНах
                    // Комментарий (memo) для идентификации пользователя на бэкенде
                    payload: btoa(`dep_${tg.initDataUnsafe.user.id}`) 
                }
            ]
        };

        try {
            // Запрашиваем подтверждение транзакции у пользователя
            await tonConnectUI.sendTransaction(transaction);
            tg.showAlert('Транзакция отправлена! После подтверждения в сети баланс будет зачислен.');
            // Закрываем приложение после успешной отправки
            tg.close();
        } catch (error) {
            console.error('Ошибка отправки транзакции:', error);
        }
    });
});
