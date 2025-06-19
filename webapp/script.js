// Функция для правильной упаковки комментария в бинарный формат (BOC)
function encodeTextPayload(text) {
    const cell = window.ton_core.beginCell()
        .storeUint(0, 32) // op-code для текстового комментария
        .storeStringTail(text)
        .endCell();
    return cell.toBoc().toString('base64');
}

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6"; 

    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://dmmrk.github.io/dice-pay-app/webapp/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    const paymentForm = document.getElementById('payment-form');
    const sendTxButton = document.getElementById('send-tx-button');
    const amountInput = document.getElementById('amount-input');

    tonConnectUI.onStatusChange(wallet => {
        paymentForm.classList.toggle('hidden', !wallet);
    });

    sendTxButton.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            // ИСПРАВЛЕНО: Используем стандартный alert
            alert('Пожалуйста, введите корректную сумму.');
            return;
        }

        const amountNano = Math.floor(amount * 1e9);
        const userId = tg.initDataUnsafe?.user?.id;

        if (!userId) {
            // ИСПРАВЛЕНО: Используем стандартный alert
            alert("Ошибка: не удалось получить ваш Telegram ID.");
            return;
        }

        const comment = `dep_${userId}`;
        const payload = encodeTextPayload(comment);

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
            messages: [
                {
                    address: BOT_WALLET_ADDRESS,
                    amount: amountNano.toString(),
                    payload: payload 
                }
            ]
        };

        try {
            await tonConnectUI.sendTransaction(transaction);
            // Уведомление об успехе можно убрать, кошелек сам его покажет
            tg.close();
        } catch (err) {
            console.error("Ошибка при отправке транзакции:", err);
            // ИСПРАВЛЕНО: Используем стандартный alert
            alert('Произошла ошибка при отправке транзакции. Попробуйте снова.');
        }
    });
});
