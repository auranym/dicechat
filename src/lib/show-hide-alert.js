function getInstance() {
  let instance = document.querySelector('dc-alert');
  if (!instance) {
    instance = document.createElement('dc-alert');
    document.body.insertBefore(instance, document.body.children[0]);
  }
  return instance;
}

export function showAlert(alert, { color = '', isClosable = true } = {}) {
  getInstance().showAlert(alert, { color, isClosable });
}

export function hideAlert() {
  getInstance().hideAlert();
}
