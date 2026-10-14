import Link from 'next/link';

const NotFound = () => (
    <div>
        <h1>404</h1>
        <p>Такой страницы нет.</p>
        <Link href="/">На главную</Link>
    </div>
);

export default NotFound;
