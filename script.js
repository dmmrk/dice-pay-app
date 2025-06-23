// Функция для правильной упаковки комментария в бинарный формат (BOC)
function encodeTextPayload(text) {
    if (!window.TonCore) {
        alert("Ошибка: Необходимая библиотека (TonCore) не загружена. Пожалуйста, обновите страницу.");
        return null;
    }
    const cell = window.TonCore.beginCell()
        .storeUint(0, 32)
        .storeStringTail(text)
        .endCell();
    return cell.toBoc().toString('base64');
}

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

    tonConnectUI.onStatusChange(wallet => {
        paymentForm.classList.toggle('hidden', !wallet);
    });

    sendTxButton.addEventListener('click', async () => {
        if (!tonConnectUI.wallet) {
            alert('Кошелек не подключен.'); return;
        }
        const amount = parseFloat(document.getElementById('amount-input').value);
        if (isNaN(amount) || amount <= 0.01) {
            alert('Введите сумму больше 0.01 TON.'); return;
        }
        const userId = tg.initDataUnsafe?.user?.id;
        if (!userId) {
            alert("Критическая ошибка: не удалось получить ваш Telegram ID."); return;
        }

        const payload = encodeTextPayload(`dep_${userId}`);
        if (!payload) return;

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{
                address: BOT_WALLET_ADDRESS,
                amount: Math.floor(amount * 1e9).toString(),
                payload: payload 
            }]
        };

        try {
            await tonConnectUI.sendTransaction(transaction);
            tg.close();
        } catch (err) { console.error(err); }
    });
});
