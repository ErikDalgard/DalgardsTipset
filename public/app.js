fetch('/api/hello')
  .then(res => res.json())
  .then(data => {
    document.getElementById('status').textContent = data.message;
  });