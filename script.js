document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6"; 

    // Инициализируем TonConnectUI, как и раньше
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://dmmrk.github.io/dice-pay-app/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    const paymentForm = document.getElementById('payment-form');
    const sendTxButton = document.getElementById('send-tx-button');
    const amountInput = document.getElementById('amount-input');

    // Эта подписка по-прежнему отвечает за показ/скрытие формы
    tonConnectUI.onStatusChange(wallet => {
        paymentForm.classList.toggle('hidden', !wallet);
    });

    // Обработчик нажатия на кнопку "Пополнить"
    sendTxButton.addEventListener('click', async () => {
        // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
        // Получаем актуальный статус кошелька напрямую из свойства .wallet
        const wallet = tonConnectUI.wallet;

        if (!wallet) {
            alert('Кошелек не подключен. Пожалуйста, сначала подключите его.');
            return;
        }

        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert('Пожалуйста, введите корректную сумму.');
            return;
        }

        const amountNano = Math.floor(amount * 1e9).toString();
        const userId = tg.initDataUnsafe?.user?.id;

        if (!userId) {
            alert("Ошибка: не удалось получить ваш Telegram ID.");
            return;
        }

        const comment = `dep_${userId}`;
        // Мы не используем payload, так как TonConnect UI сам его формирует
        // на основе простого текстового комментария.

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
            messages: [
                {
                    address: BOT_WALLET_ADDRESS,
                    amount: amountNano,
                    // payload: btoa(comment) // Можно передавать как простой текст, либо убрать, если кошелек ругается
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
