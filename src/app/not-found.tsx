import Link from "next/link";
import styles from "./not-found.module.scss";

export default function NotFound() {
  return (
    <main className={styles.NotFound}>
      <div className="container">
        <h1>404</h1>
        <div>
          <p>Nothing lives here.</p>
          <p>
            <Link href="/">Back to the collections</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
