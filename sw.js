self.addEventListener('fetch', (e) => {
  e.respondWith(
    new Response('Hello <strong>Ben</strong>.', {
      headers: {'Content-Type': 'text/html'}
    })
  );
});