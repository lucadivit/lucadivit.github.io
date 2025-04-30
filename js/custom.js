// Disable MathJax Zoom
if (window.MathJax) {
  MathJax.Hub.Register.StartupHook("End Config", function () {
    MathJax.Hub.Config({
      menuSettings: { zoom: "None" }
    });
  });
}