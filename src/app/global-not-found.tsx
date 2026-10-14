import Link from 'next/link';

const GlobalNotFound = () => (
    <html lang="ru">
        <body>
            <h1>404</h1>
            <p>Такой страницы нет.</p>
            <Link href="/">На главную</Link>
        </body>
    </html>
);

export default GlobalNotFound;
