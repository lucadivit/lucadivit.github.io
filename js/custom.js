function disableMathJaxZoomAfterRender() {
  if (window.MathJax && MathJax.Hub) {
    MathJax.Hub.Register.MessageHook("End Process", function () {
      MathJax.Hub.Config({
        menuSettings: { zoom: "None" }
      });
    });
  } else {
    setTimeout(disableMathJaxZoomAfterRender, 300);
  }
}

disableMathJaxZoomAfterRender();