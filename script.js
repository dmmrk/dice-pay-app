document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Адрес кошелька вашего БОТА
    const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6"; 

    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://dmmrk.github.io/dice-pay-app/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    const paymentForm = document.getElementById('payment-form');
    const sendTxButton = document.getElementById('send-tx-button');
    const amountInput = document.getElementById('amount-input');

    tonConnectUI.onStatusChange(wallet => {
        paymentForm.classList.toggle('hidden', !wallet);
    });

    sendTxButton.addEventListener('click', async () => {
        if (!tonConnectUI.wallet) {
            alert('Кошелек не подключен. Пожалуйста, сначала подключите его.');
            return;
        }

        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0.01) {
            alert('Пожалуйста, введите сумму больше 0.01 TON.');
            return;
        }

        const amountNano = Math.floor(amount * 1e9).toString();

        // --- ИЗМЕНЕНО: СОЗДАЕМ ТРАНЗАКЦИЮ БЕЗ PAYLOAD (MEMO) ---
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
            messages: [
                {
                    address: BOT_WALLET_ADDRESS,
                    amount: amountNano
                    // поле payload полностью отсутствует
                }
            ]
        };

        try {
            await tonConnectUI.sendTransaction(transaction);
            tg.showAlert('Транзакция отправлена! Обратитесь к администратору для зачисления.');
            tg.close();
        } catch (err) {
            console.error("Ошибка при отправке транзакции:", err);
        }
    });
});
