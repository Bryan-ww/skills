import Popup from 'ol-ext/overlay/Popup'

export const createNamePopup = () => {
  const popup = new Popup({
    popupClass: "map-device-name-popup",
    closeBox: false,
    onshow: function(){  },
    onclose: function(){  },
    positioning: 'center-left',
    // autoPan: {
    //   animation: { duration: 250 }
    // }
  });
  popup.hide()

  return popup;
}