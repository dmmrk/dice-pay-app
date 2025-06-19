function encodeTextPayload(text) {
    const cell = window.ton_core.beginCell()
        .storeUint(0, 32)
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

    let walletConnected = false;

    tonConnectUI.onStatusChange(wallet => {
        walletConnected = !!wallet;
        paymentForm.classList.toggle('hidden', !walletConnected);
    });

    sendTxButton.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert('Введите корректную сумму.');
            return;
        }

        const amountNano = Math.floor(amount * 1e9);
        const userId = tg.initDataUnsafe?.user?.id;
        if (!userId) {
            alert("Ошибка: не удалось получить ваш Telegram ID.");
            return;
        }

        const comment = `dep_${userId}`;

        if (walletConnected) {
            // ✅ Отправка через TonConnect
            const payload = encodeTextPayload(comment);
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300,
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
                tg.close();
            } catch (err) {
                console.error("Ошибка транзакции:", err);
                alert('Не удалось отправить транзакцию.');
            }
        } else {
            // ✅ Открыть Telegram Wallet через ссылку
            const tonLink = `https://wallet.ton.org/transfer/${BOT_WALLET_ADDRESS}?amount=${amountNano}`;
            window.location.href = tonLink;
        }
    });
});
