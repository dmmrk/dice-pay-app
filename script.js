// Функция для правильной упаковки комментария в бинарный формат (BOC)
function encodeTextPayload(text) {
    // ИСПРАВЛЕНО: Правильное имя объекта библиотеки - TonCore, а не ton_core
    const cell = window.TonCore.beginCell()
        .storeUint(0, 32) // op-code для текстового комментария
        .storeStringTail(text)
        .endCell();
    return cell.toBoc().toString('base64');
}

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    console.log("Приложение загружено, tg объект:", tg);

    // Если открыто не в Telegram, показываем ошибку
    if (!tg.initData) {
        document.getElementById('app').innerHTML = '<h1>Ошибка</h1><p>Это приложение можно открыть только внутри Telegram.</p>';
        return;
    }

    tg.ready();
    tg.expand();

    const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6"; 

    console.log("Инициализация TON Connect...");
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://dmmrk.github.io/dice-pay-app/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });
    console.log("TON Connect UI инициализирован.");

    const paymentForm = document.getElementById('payment-form');
    const sendTxButton = document.getElementById('send-tx-button');
    const amountInput = document.getElementById('amount-input');

    tonConnectUI.onStatusChange(wallet => {
        console.log("Статус кошелька изменился:", wallet);
        paymentForm.classList.toggle('hidden', !wallet);
    });

    sendTxButton.addEventListener('click', async () => {
        console.log("Кнопка 'Пополнить' нажата.");

        if (!tonConnectUI.connected) {
            alert('Кошелек не подключен. Пожалуйста, сначала подключите кошелек.');
            return;
        }

        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0.01) {
            alert('Пожалуйста, введите сумму больше 0.01 TON.');
            return;
        }
        console.log(`Введена сумма: ${amount} TON`);

        const amountNano = Math.floor(amount * 1e9);
        const userId = tg.initDataUnsafe?.user?.id;

        if (!userId) {
            alert("Критическая ошибка: не удалось получить ваш Telegram ID.");
            return;
        }
        console.log(`ID пользователя: ${userId}`);

        const comment = `dep_${userId}`;
        const payload = encodeTextPayload(comment);
        console.log(`Сгенерирован payload: ${payload}`);

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{
                address: BOT_WALLET_ADDRESS,
                amount: amountNano.toString(),
                payload: payload 
            }]
        };

        console.log("Подготовка к отправке транзакции...", transaction);

        try {
            await tonConnectUI.sendTransaction(transaction);
            console.log("Транзакция успешно отправлена через провайдер.");
            tg.close();
        } catch (err) {
            console.error("Ошибка при вызове sendTransaction:", err);
            alert('Произошла ошибка при отправке транзакции. Посмотрите консоль для деталей.');
        }
    });
});
