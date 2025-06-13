document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const BOT_WALLET_ADDRESS = "ВАШ_АДРЕС_КОШЕЛЬКА_БОТА"; // <-- ВАЖНО: Вставьте сюда адрес!

    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://ВАШ_НИК_GITHUB.github.io/dice-pay-app/webapp/tonconnect-manifest.json', // <-- ВАЖНО: Укажите здесь свой путь!
        buttonRootId: 'ton-connect-button'
    });

    tonConnectUI.onStatusChange(wallet => {
        document.getElementById('payment-form').classList.toggle('hidden', !wallet);
    });

    document.getElementById('send-tx-button').addEventListener('click', async () => {
        const amount = parseFloat(document.getElementById('amount-input').value);
        if (isNaN(amount) || amount <= 0) {
            tg.showAlert('Пожалуйста, введите корректную сумму.');
            return;
        }
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 360,
            messages: [{
                address: BOT_WALLET_ADDRESS,
                amount: (amount * 1_000_000_000).toString(),
                payload: btoa(`dep_${tg.initDataUnsafe.user.id}`)
            }]
        };
        try {
            await tonConnectUI.sendTransaction(transaction);
            tg.close(); // Закрываем Mini App после отправки
        } catch (error) { console.error(error); }
    });
});