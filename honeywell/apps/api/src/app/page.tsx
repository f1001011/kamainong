export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>lendlease API Service</h1>
      <p>API service is running on port 3002.</p>
      <p>
        <a href="/api/heartbeat">Health Check</a>
      </p>
    </main>
  );
}
