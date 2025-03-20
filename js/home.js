document.querySelectorAll('.menu-top ul li a').forEach(link => {
  link.addEventListener('click', function() {
      document.querySelectorAll('.menu-top ul li.active').forEach(active => active.classList.remove('active'));
      this.parentElement.classList.add('active');
  });
});
