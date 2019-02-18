import idiom from 'idiom.js'

const lang = idiom({
  'default': {
    'welcome': 'Welcome'
  },
  'pt-BR': {
    'welcome': 'Bem vindo ao Phaser + ES6 + Webpack!'
  }
})

export default lang(window.navigator.language)
