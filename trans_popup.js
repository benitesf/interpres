class Popup extends HTMLElement {
    static get observedAttributes() {
        return ['content', 'top', 'left', 'width', 'height']
    }

    constructor() {
        super()
        const t = document.querySelector('#trans-popup-template').content.cloneNode(true)
        this.attachShadow({mode: 'open'}).appendChild(t)
    }

    attributeChangedCallback(attribute, oldVal, newVal) {
        const main = this.shadowRoot.querySelector('main')

        if (attribute == 'content') {
            main.innerHTML = newVal

            setTimeout(function() {
                const main = this.shadowRoot.querySelector('main')
                const style = window.getComputedStyle(main)

                this.setAttribute('content-width', parseFloat(style.width))
                this.setAttribute('content-height', parseFloat(style.height))

                this.setAttribute('outer-width', main.offsetWidth)
                this.setAttribute('outer-height', main.offsetHeight)

                const e = new CustomEvent('trans-popup-content-updated')
                this.dispatchEvent(e)
            }.bind(this), 0)
        } else if (attribute == 'top') {
            main.style.top = newVal + 'px'
        } else if (attribute == 'left') {
            main.style.left = newVal + 'px'
        } else if (attribute == 'width') {
            main.style.width = newVal + 'px'
        } else if (attribute == 'height') {
            main.style.height = newVal + 'px'
        }
    }
}

window.customElements.define('trans-popup', Popup)