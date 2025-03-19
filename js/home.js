document.querySelectorAll('.menu-bottom ul li a').forEach(link => {
  link.addEventListener('click', function() {
      document.querySelector('.menu-bottom ul li.active').classList.remove('active');
      this.parentElement.classList.add('active');
  });
});
