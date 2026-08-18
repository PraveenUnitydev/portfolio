/* props.js — models removed, canvas hidden on mobile */
(function () {
  /* The 3D scene is now entirely in background.js.
     This file just ensures the old props canvas
     (if any residual element exists) is gone. */
  const old = document.getElementById('props-canvas');
  if (old) old.remove();
}());
