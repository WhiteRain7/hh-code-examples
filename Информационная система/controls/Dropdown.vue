<template>
    <div
        ref="container"
        class="dropdown-container"
        :class="{ expanded, centered, navigation }"
        :style="{
            [centered ? 'padding-inline' : 'padding-right']: (arrowSize ? 10 + Number(arrowSize) + 'px' : null)
        }"
        @pointerdown.stop
        @click="toggle"
        @keydown="keydown($event)"
        :tabindex="disabled ? -1 : 0"
        :title="title"
        :aria-label="title"
        :aria-disabled="disabled ? 'true' : 'false'"
        role="listbox">

        <button
            v-if="!selected || navigation"
            ref="selected"
            type="button"
            class="dropdown-button"
            tabindex="-1">

            <svg
                v-if="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                class="dropdown-icon">

                <path :d="icon" />
            </svg>

            <span
                v-if="placeholder || title"
                class="dropdown-placeholder"
                :class="{ invalid: required && !selected || value && !values.includes(value) }"
                v-html="placeholder || title">
            </span>
        </button>

        <button
            v-else-if="!multiple"
            ref="selected"
            type="button"
            class="dropdown-selected"
            tabindex="-1"
            v-html="selected.outerHTML">
        </button>

        <template v-if="arrows[arrowType]">
            <template v-if="arrows[arrowType].regular">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="dropdown-arrow regular"
                    :style="{
                        width: arrowSize + 'px',
                        height: arrowSize + 'px'
                    }"
                    :viewBox="arrows[arrowType].regular.viewBox"
                    v-html="arrows[arrowType].regular.pathD">
                </svg>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="dropdown-arrow active"
                    :style="{
                        width: arrowSize + 'px',
                        height: arrowSize + 'px'
                    }"
                    :viewBox="arrows[arrowType].active.viewBox"
                    v-html="arrows[arrowType].active.pathD">
                </svg>
            </template>

            <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="dropdown-arrow rotate"
                :style="{
                    width: arrowSize + 'px',
                    height: arrowSize + 'px',
                    rotate: arrows[arrowType].rotate + 'deg'
                }"
                :viewBox="arrows[arrowType].viewBox"
                v-html="arrows[arrowType].pathD">
            </svg>
        </template>

        <menu
            ref="dropdown"
            class="dropdown-content"
            :class="{ expanded }"
            popover="manual"
            @toggle="expanded = $event.newState === 'closed' ? false : expanded"
            @wheel.stop
            @click.stop
            tabindex="-1"
            role="group">

            <li v-if="nullable" v-value="null" class="dropdown-nullable" v-html="placeholder || title || 'Выберите'">
            </li>

            <slot></slot>
        </menu>
    </div>
</template>


<script>
export default {
    name: 'Dropdown',

    props: {
        icon: {
            type: String, // svgPath
            default: null
        },
        placeholder: {
            type: String,
            default: null
        },
        title: {
            type: String,
            default: null
        },
        arrow: {
            type: String, // 'type-size', i.e. 'v-40' or 'collapse-32'
            default: null
        },

        value: {
            default: null
        },

        multiple: Boolean,
        nullable: Boolean, // insert null as first value
        navigation: Boolean, // emits change events but without setting any value
        disabled: Boolean,
        required: Boolean,

        syncedWidth: Boolean, // if true, width of menu is exactly equal to width of container
        centered: Boolean // if true, adds text-align: center to elements and placeholder with specificity (0, 2, 0)
    },

    data: function () {
        return {
            selected: this.multiple ? [] : null,
            expanded: false,

            focused: null,

            values: [],

            hideTimeoutId: null,
            observer: null,
            listenedOptions: [],

            arrowType: this.arrow ? this.arrow.split('-')[0] : null,
            arrowSize: this.arrow ? this.arrow.split('-')[1] ?? 32 : null,

            arrows: { // rotate regular when active or different icons
                v       : { rotate: 180, viewBox: '0 -960 960 960', pathD: '<path d="M480-345 240-585l43-43 197 198 197-197 43 43-240 239Z"/>' },
                triangle: { rotate: 90 , viewBox: '0 -960 960 960', pathD: '<path d="M480-360 280-559h400L480-360Z"/>' },
                swap    : { rotate: 0  , viewBox: '0 -960 960 960', pathD: '<path d="M323-450v-316L202-645l-42-42 193-193 193 193-42 42-121-121v316h-60ZM607-80 414-273l42-42 121 121v-316h60v316l121-121 42 42L607-80Z"/>' },
                '...'   : { rotate: 0  , viewBox: '0 -960 960 960', pathD: '<path d="M479.858-160Q460-160 446-174.142q-14-14.141-14-34Q432-228 446.142-242q14.141-14 34-14Q500-256 514-241.858q14 14.141 14 34Q528-188 513.858-174q-14.141 14-34 14Zm0-272Q460-432 446-446.142q-14-14.141-14-34Q432-500 446.142-514q14.141-14 34-14Q500-528 514-513.858q14 14.141 14 34Q528-460 513.858-446q-14.141 14-34 14Zm0-272Q460-704 446-718.142q-14-14.141-14-34Q432-772 446.142-786q14.141-14 34-14Q500-800 514-785.858q14 14.141 14 34Q528-732 513.858-718q-14.141 14-34 14Z"/>' },
                collapse: { // <> and >< (but vertical)
                    regular: { viewBox: '0 -960 960 960', pathD: '<path d="M480-80 240-320l44-44 196 196 196-196 44 44L480-80ZM284-596l-44-44 240-240 240 240-44 44-196-196-196 196Z"/>' },
                    active : { viewBox: '0 -960 960 960', pathD: '<path d="m290-85-42-42 232-232 232 232-42 42-190-190L290-85Zm190-517L248-834l42-42 190 190 190-190 42 42-232 232Z"/>' },
                },
            }
        }
    },

    watch: {
        value: function () { this.rearrange() },
        multiple: function () { this.rearrange() },

        arrow: function () {
            this.arrowType = this.arrow ? this.arrow.split('-')[0] : null
            this.arrowSize = this.arrow ? this.arrow.split('-')[1] ?? 32 : null
        },

        expanded: function () {
            if (this.expanded) {
                clearTimeout(this.hideTimeoutId)
                this.recalculatePopover()
                try { this.$refs.dropdown.showPopover() } catch {}
            }
            else try {
                this.focused = null
                this.hideTimeoutId = setTimeout(() => {
                    try { this.$refs.dropdown.hidePopover() } catch {}
                }, 250)
            } catch {}
        },

        focused: function (newOne, oldOne) {
            if (oldOne) {
                oldOne.classList.remove('focused')
                oldOne.removeAttribute('aria-activedescendant')
            }
            if (newOne) {
                newOne.classList.add('focused')
                newOne.setAttribute('aria-activedescendant', 'true')
                newOne.scrollIntoView({ block: 'center' })
            }
        },
    },

    mounted: function () {
        this.rearrange()

        const observer = new MutationObserver(this.rearrange)
        observer.observe(this.$refs.dropdown, { childList: true, subtree: true })
        this.observer = observer

        if (process.browser) {
            window.addEventListener('resize', this.recalculatePopover)
            document.body.addEventListener('pointerdown', () => { this.expanded = false })
            document.body.addEventListener('wheel', () => { this.expanded = false })
        }
    },

    beforeDestroy: function () {
        if (this.observer) this.observer.disconnect()
        if (process.browser) {
            window.removeEventListener('resize', this.recalculatePopover)
        }
    },

    methods: {
        emitChange (value) {
            let changeEvent = new CustomEvent('change', {
                bubbles: true,
                cancelable: true,
                composed: true,
                detail: { value },
                type: 'change',
                target: this.$refs.container,
            })

            Object.defineProperty(changeEvent, 'target', { writable: false, value: this.$refs.container })

            this.$emit('change', changeEvent)
            this.$emit('input', value)
            if (!this.navigation) {
                this.$emit('update:modelValue', value)
            }
        },

        modelValue () {
            if (this.multiple) {
                return this.values?.map(v => v?.id ?? v) ?? []
            }
            return this.value?.id ?? this.value
        },

        valueOf (option, emit = false) {
            return option.$value === undefined ?
                option.dataset.value :
                emit ? option.$value : (option.$value?.id ?? option.$value)
        },

        rearrange () {
            this.selected = this.multiple ? [] : null
            this.values = []

            const options = this.$refs.dropdown.querySelectorAll('li')
            if (!options.length) return

            for (let i = 0; i < options.length; i++) {
                const option = options[i]

                option.role = 'option'
                if (option.querySelector(':scope > ul')) {
                    option.classList.add('nesting')
                    continue
                }

                if (!option.hasAttribute('data-value')) {
                    option.setAttribute('data-value', option.$value === undefined ? option.textContent : option.$value)
                }
                if (option.$value === undefined) {
                    option.$value = option.dataset.value
                }

                this.values.push(this.valueOf(option))

                if (!this.listenedOptions.includes(option)) {
                    this.listenedOptions.push(option)

                    option.addEventListener('click', () => {
                        if (this.readonly) return

                        if (!this.multiple) {
                            if (this.selected === option) return

                            if (!this.navigation) {
                                if (this.selected) this.selected.ariaSelected = false
                                if (this.valueOf(option) === undefined) this.selected = null
                                else {
                                    option.ariaSelected = true
                                    this.selected = option
                                }
                            }

                            this.expanded = false

                            this.$refs.container.value = this.valueOf(option)
                            this.emitChange(this.valueOf(option, true))
                        }

                        else {
                            option.ariaSelected = !option.ariaSelected

                            if (option.ariaSelected) this.selected.push(option)
                            else this.selected.splice(this.selected.indexOf(option), 1)

                            this.emitChange(this.selected.map(o => this.valueOf(o, true)))
                        }
                    })
                }

                if (this.multiple && this.modelValue().includes(this.valueOf(option))) option.ariaSelected = true
                else if (this.valueOf(option) == this.modelValue()) option.ariaSelected = true
                else option.ariaSelected = false

                if (option.ariaSelected === 'true') {
                    if (this.multiple) this.selected.push(option)
                    else this.selected = option
                }
            }

            const optgroups = this.$refs.dropdown.querySelectorAll('ul')
            if (!optgroups.length) return

            for (let i = 0; i < optgroups.length; i++) {
                const optgroup = optgroups[i]

                optgroup.role = 'group'
                optgroup.setAttribute('popover', 'manual')

                let label = optgroup.parentElement.querySelector(':scope > label')

                if (!label) {
                    label = document.createElement('label')
                    label.textContent = optgroup.getAttribute('label') || 'Список'
                    optgroup.parentElement.insertBefore(label, optgroup)
                }

                optgroup.parentElement.addEventListener('pointerenter', () => {
                    optgroup.ariaExpanded = true
                    try { optgroup.showPopover() } catch {}
                    this.recalculateNested(optgroup)
                })

                optgroup.parentElement.addEventListener('pointerleave', () => {
                    optgroup.ariaExpanded = false
                    try { optgroup.hidePopover() } catch {}
                })
            }
        },

        recalculateNested (optgroup) {
            const elem = optgroup.parentElement.querySelector(':scope > label')
            if (!elem) return

            let x = optgroup.parentElement.parentElement.offsetLeft + optgroup.parentElement.parentElement.offsetWidth - 6
            let y = optgroup.parentElement.parentElement.offsetTop + optgroup.parentElement.offsetTop - optgroup.parentElement.parentElement.scrollTop

            if (x + elem.offsetWidth + 10 > window.innerWidth) x = window.innerWidth - elem.offsetWidth - 10
            if (y + elem.offsetHeight + 10 > window.innerHeight) y = window.innerHeight - elem.offsetHeight - 10

            optgroup.style.left = x + 'px'
            optgroup.style.top = y + 'px'
        },

        recalculatePopover () {
            const rect = this.$refs.container.getBoundingClientRect()

            const elem = this.$refs.dropdown

            let x = rect.left
            let y = rect.top + this.$refs.container.offsetHeight + 8

            if (x + elem.offsetWidth + 10 > innerWidth) x = innerWidth - elem.offsetWidth - 10
            if (y + elem.offsetHeight + 10 > innerHeight) y = innerHeight - elem.offsetHeight - 10

            elem.style.left = x + 'px'
            elem.style.top = y + 'px'
            elem.style.minWidth = rect.width + 'px'

            if (this.syncedWidth) {
                elem.style.maxWidth = rect.width + 'px'
            }
        },


        nextSibling (item) {
            item = item.nextElementSibling || item.parentElement.firstElementChild
            while (item?.tagName !== 'LI') {
                item = item?.nextElementSibling || item.parentElement.firstElementChild
            }
            return item
        },
        prevSibling (item) {
            item = item.previousElementSibling || item.parentElement.lastElementChild
            while (item?.tagName !== 'LI') {
                item = item?.previousElementSibling || item.parentElement.lastElementChild
            }
            return item
        },

        toggle () {
            if (this.disabled && !this.expanded) return
            this.expanded = !this.expanded
            this.$emit('click')
        },

        keydown (event) {
            if (event.key == 'Tab' || this.disabled) return
            else {
                event.stopPropagation()
                event.preventDefault()
            }

            if (event.key === 'Escape') {
                this.expanded = false
                this.focused = null
            }

            if (this.expanded) {
                if (!this.$refs.dropdown.querySelector('li')) return
                if (this.focused === null) this.focused = this.$refs.dropdown.firstElementChild

                switch (event.key) {
                    case 'ArrowDown':
                        this.focused = this.nextSibling(this.focused)
                        break

                    case 'ArrowUp':
                        this.focused = this.prevSibling(this.focused)
                        break

                    case 'ArrowRight':
                        if (this.focused.classList.contains('nesting') && !this.focused.ariaExpanded) {
                            Object.values(this.focused.parentElement.querySelectorAll('li.nesting > ul')).forEach(elem => { elem.ariaExpanded = false })
                            let ul = this.focused.querySelector(':scope > ul')
                            ul.ariaExpanded = true
                            this.recalculateNested(ul)
                            this.focused = ul.querySelector(':scope > li')
                        }
                        break

                    case 'ArrowLeft':
                        if (this.focused.classList.contains('nesting') && this.focused.ariaExpanded) {
                            this.focused.querySelector(':scope > ul').ariaExpanded = false
                        }
                        else {
                            if (this.focused.parentElement.getAttribute('role') === 'menu') break
                            this.focused = this.focused.parentElement.parentElement
                            this.focused.querySelector(':scope > ul').ariaExpanded = false
                        }
                        break

                    case 'Enter':
                        this.expanded = false
                        this.focused?.dispatchEvent(new Event('click'))
                        break

                    case ' ':
                        if (this.focused.classList.contains('nesting')) {
                            let ul = this.focused.querySelector(':scope > ul')

                            if (!ul.ariaExpanded) {
                                Object.values(this.focused.parentElement.querySelectorAll('li.nesting > ul')).forEach(elem => { elem.ariaExpanded = false })
                                ul.ariaExpanded = true
                                this.recalculateNested(ul)
                            }

                            else {
                                ul.ariaExpanded = false
                            }
                        }
                        else this.focused?.dispatchEvent(new Event('click'))
                        break

                    default:
                        const options = Object.values(this.focused.parentElement.querySelectorAll(':scope > li'))
                        const index = options.indexOf(this.focused)

                        let first = null
                        let found = false

                        let i = 0
                        for (let option of options) try {
                            if (option.textContent.toLowerCase().trim().startsWith(event.key.toLowerCase())) {
                                if (first === null) first = option

                                if (i > index) {
                                    this.focused = option
                                    found = true
                                    break
                                }
                            }
                            i += 1
                        } catch {}

                        if (!found && first) this.focused = first

                        break
                }
            }

            else {
                switch (event.key) {
                    case 'ArrowDown':
                    case 'ArrowLeft':
                    case 'ArrowRight':
                        this.expanded = true
                        break
                }
            }
        },


        focus () {
            this.$refs.container.focus()
            this.expanded = true
        }
    }
}
</script>


<style scoped>
.dropdown-container {
    cursor: pointer;
    position: relative;
}
.dropdown-container[aria-disabled="true"] {
    opacity: .5;
}

.dropdown-button {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 100%;
    user-select: none;
}
.dropdown-icon {
    flex-shrink: 0;
    height: 100%;
    max-height: 36px;
}
.dropdown-placeholder {
    text-align: left;
}
:not(.navigation) > .dropdown-button > .dropdown-placeholder {
    color: #444;
}
.centered > .dropdown-button > .dropdown-placeholder {
    width: 100%;
    text-align: center;
}

.dropdown-placeholder.invalid {
    color: #ff5100;
    text-decoration: line-through;
}

.dropdown-selected {
    width: 100%;
    height: 100%;
    user-select: none;
    list-style: none;
}

.dropdown-container:focus-within {
    outline: 3px solid var(--company-back);
    outline-offset: -1px;
}


.dropdown-arrow {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    transform-origin: 50% 0;
    fill: currentColor;
    transition: .3s;
}

.dropdown-container:not(.expanded) .dropdown-arrow.rotate {
    rotate: 0deg !important;
}

.dropdown-container.expanded .dropdown-arrow.regular { opacity: 0; }
.dropdown-container:not(.expanded) .dropdown-arrow.active { opacity: 0; }


.dropdown-content {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 0;
    position: fixed;
    max-height: 60vh;
    padding: 6px 0;
    border-radius: 6px;
    background: #fff;
    color: #000;
    box-shadow: 0 1px 4px 0 #888;
    list-style: none;
    cursor: default;
    transition: .25s;
    transition-property: transform, opacity;
    z-index: 99999;
}

.dropdown-content :is(ul, ol, li) {
    list-style: none;
}

.dropdown-content::-webkit-scrollbar {
    width: 6px;
    height: 6px;
    border-radius: 0 666px 666px 0;
    background: #EEE;
}
.dropdown-content::-webkit-scrollbar-thumb {
    width: 6px;
    height: 6px;
    border-radius: 0 666px 666px 0;
    background: #888;
}

.dropdown-content:not(.expanded) {
    transform: translateY(-20px);
    opacity: 0;
    pointer-events: none;
}

.dropdown-content :deep(li) {
    flex-shrink: 0;
    box-sizing: border-box;
    width: 100%;
    padding: 4px 20px;
    user-select: none;
    cursor: pointer;
    transition: background-color .3s;
    position: relative;
}
.dropdown-content :deep(li:hover) {
    background: #F0F0F0;
}
.dropdown-content :deep(li:active) {
    background: #aabbc5;
}
.dropdown-content :deep(li[aria-selected=true]) {
    background: #485b66;
    color: #FFF;
}
.dropdown-content :deep(li[aria-selected=true]::before) {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 10px;
    transform: translate(-50%, -50%);
    color: inherit;
    font-size: 16px;
    font-weight: bold;
}
.dropdown-content :deep(li:disabled) {
    opacity: .5;
    cursor: default;
    pointer-events: none;
}

.centered .dropdown-content :deep(li) {
    text-align: center;
}

.dropdown-content :deep(li.focused) {
    outline: 2px solid var(--company-back);
    outline-offset: -2px;
}

.dropdown-content :deep(li.nesting) {
    position: relative;
}
.dropdown-content :deep(li.nesting::after) {
    content: '›';
    position: absolute;
    top: 50%;
    right: 6px;
    transform: translate(-50%, -50%);
    color: inherit;
    font-size: 16px;
    font-weight: bold;
}
.dropdown-content :deep(li.nesting > label) {
    cursor: pointer;
}

.dropdown-content :deep(li.nesting > ul) {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 0;
    position: fixed;
    min-width: 200px;
    max-height: 30vh;
    padding: 6px 0;
    border-radius: 6px;
    background: #fff;
    color: #000;
    box-shadow: 0 1px 4px 0 #888;
    overflow: auto;
    list-style: none;
    cursor: default;
    transition-property: transform, opacity;
    z-index: 99999;
}

.dropdown-content :deep(li.nesting > ul::-webkit-scrollbar) {
    width: 6px;
    height: 6px;
    border-radius: 0 666px 666px 0;
    background: #EEE;
}
.dropdown-content :deep(li.nesting > ul::-webkit-scrollbar-thumb) {
    width: 6px;
    height: 6px;
    border-radius: 0 666px 666px 0;
    background: #888;
}
.dropdown-content :deep(li.nesting > ul[aria-expanded=true]) {
    animation: nesting-showing .25s forwards;
}
.dropdown-content :deep(li.nesting > ul:not([aria-expanded=true])) {
    animation: nesting-hidden .25s forwards;
}
@keyframes nesting-hidden {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        display: none;
        opacity: 0;
        transform: translateY(-20px);
        pointer-events: none;
    }
}
@keyframes nesting-showing {
    from {
        display: none;
        opacity: 0;
        transform: translateY(-20px);
        pointer-events: none;
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.dropdown-content :deep(hr) {
    width: 100%;
    height: 1px;
    min-height: 1px;
    max-height: 1px;
    margin: 4px 0;
    border: none;
    background: #999;
}

.dropdown-content :deep(strong),
.dropdown-content :deep(h1) {
    box-sizing: border-box;
    width: 100%;
    padding-inline: 6px;
    margin-top: 10px;
    font-weight: bold;
    color: #000;
}
.dropdown-content :deep(strong:first-child),
.dropdown-content :deep(h1:first-child) {
    margin-top: 0;
}

.dropdown-content :deep(strong + hr),
.dropdown-content :deep(h1 + hr) {
    margin-top: 0;
    background: #000;
}

.dropdown-nullable {
    color: #999 !important;
}


/* Стили для бокового окна, выбор года для программ благоустройства */
.overview-header_dropdown-year {
    border: 1px solid #000;
    min-height: 36px;
    height: auto;
    padding-left: 16px;
    display: flex;
    align-items: center;
}

.overview-header_dropdown-year.expanded .dropdown-content {
    border: 1px solid #000;
    box-shadow: none !important;
    border-radius: 0 !important;
}

</style>
