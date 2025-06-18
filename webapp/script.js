document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6";

    const paymentForm = document.getElementById('payment-form');
    const sendTxButton = document.getElementById('send-tx-button');
    const amountInput = document.getElementById('amount-input');

    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://dmmrk.github.io/dice-pay-app/webapp/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    // Показываем форму после подключения кошелька
    tonConnectUI.onStatusChange(wallet => {
        paymentForm.classList.toggle('hidden', !wallet);
    });

    sendTxButton.addEventListener('click', () => {
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            tg.showAlert('Введите корректную сумму.');
            return;
        }

        const amountNano = Math.floor(amount * 1e9);
        const userId = tg.initDataUnsafe?.user?.id;

        if (!userId) {
            tg.showAlert("Ошибка: не удалось получить ваш Telegram ID.");
            return;
        }

        const tonLink = `https://wallet.ton.org/transfer/${BOT_WALLET_ADDRESS}?amount=${amountNano}&text=dep_${userId}`;
        window.location.href = tonLink;
    });
});
