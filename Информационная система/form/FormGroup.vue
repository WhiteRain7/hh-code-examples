<template>
    <fieldset ref="group" class="form-group" :inert="inert">
        <legend v-if="group.name" class="form-group-name">{{ group.name }}</legend>

        <header class="form-group-progress" :class="{ filled: progress.checked === progress.all }">
            <div class="form-group-progress-overview">
                <ul class="form-group-progress-states" aria-hidden="true">
                    <li
                        v-for="(state, index) in progress.states"
                        class="form-group-progress-state"
                        :key="index"
                        :class="state.state"
                        :title="(state.name || ('Поле ' + (index + 1))) + ' - ' + titles[state.state]"
                        @click="scrollTo(state.name)">
                    </li>
                </ul>

                <label class="form-group-progress-track">
                    <span class="ratio">{{ progress.checked }} / {{ progress.all }}</span>
                    <span class="percent">{{ progress.percent }}</span>
                </label>
            </div>

            <progress max="1" :value="progress.ratio" class="form-group-progress-bar"></progress>
        </header>

        <div class="form-group-content">
            <section
                v-for="(field, index) in $parent.remembered(group.uuid)"
                :key="(group.uuid || '') + index"
                class="form-group-meta-field">

                <label>{{ field.name }}</label>

                <div v-html="field.content"></div>
            </section>

            <FormField
                ref="fields"
                v-for="(field, identifier) in group.fields"
                :key="(group.uuid || '') + identifier"
                :identifier="identifier"
                :field="field" />
        </div>
    </fieldset>
</template>


<script>
export default {
    name: 'FormGroup',

    props: {
        /**
         * @type {{
         *     uuid: string
         *     name?: string
         *     fields: Array<any>
         * }}
         */
        group: Object,
        inert: Boolean
    },

    components: {
        FormField: () => import('./FormField.vue')
    },

    data () {
        let progress = {
            ratio: 0,
            percent: '0%',
            checked: 0,
            all: Object.keys(this.group.fields).length,
            states: []
        }

        for (const identifier in this.group.fields) {
            progress.states.push({
                identifier,
                state: 'invitation',
                name: this.group.fields[identifier].name,
                checked: false
            })
        }

        return {
            progress,

            titles: {
                invitation: 'Пустое необязательное поле',
                success: 'Поле заполнено',
                error: 'Ошибка заполнения',
                readonly: 'Поле не редактируется'
            }
        }
    },

    watch: {
        inert () {
            if (!this.inert) this.$forceUpdate()
        }
    },

    methods: {
        clear () {
            for (const elem of this.$refs.fields) elem.clear()
        },
        collect () {
            let values = {}

            for (const identifier in this.group.fields) {
                if (this.group.fields[identifier].__vue__.included) {
                    values[identifier] = this.group.fields[identifier].__vue__.collect()
                }
            }

            return values
        },


        isValid () {
            for (const elem of this.$refs.fields) if (!elem.isValid()) return false

            return true
        },

        setState (identifier, data) {
            let index = this.progress.states.findIndex(s => s.identifier === identifier)

            if (index === -1) {
                this.progress.states.push({ identifier, ...data })

                let order = Object.keys(this.group.fields)
                this.progress.states.sort((a, b) => order.indexOf(a.identifier) - order.indexOf(b.identifier))
            }
            else {
                this.progress.states[index] = { identifier, ...data }
            }

            this.group._changed = true
            this._calcProgress()
        },

        removeState (identifier) {
            this.progress.states = this.progress.states.filter(s => s.identifier !== identifier)
            this._calcProgress()
        },

        _calcProgress () {
            this.progress.checked = this.progress.states.filter(s => s.checked).length
            this.progress.all = this.progress.states.length
            this.progress.ratio = this.progress.checked / (this.progress.all || 1)
            this.progress.percent = (this.progress.ratio * 100)
                .toFixed(2)                         // to 2 digits after .
                .match(/\d+(\.[1-9][1-9]?)?/)[0]    // removes trailing 0 after .
                .replace('.', ',')
                + '%'

            this.$forceUpdate()
        },


        scrollTo (name) {
            for (const field of this.$refs.fields) {
                if (field.name === name) return field.scrollIntoView()
            }
        },

        getContext () {
            return {
                name: this.group.name,
                meta: this.group.meta,
                progress: this.progress,
                values: this.$parent.collect()
            }
        }
    }
}
</script>


<style scoped>
.form-group {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 20px;
    width: 100%;
}

.form-group-progress {
    position: sticky;
    top: 0;
    width: 100%;
    background: #e4e4e4;
    border-radius: 10px;
    overflow: hidden;
    font-size: 0;
    transition: .3s;
    z-index: 100;
}
.form-group-progress.filled {
    background: #e6f1e6;
}

    .form-group-progress-overview {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        box-sizing: border-box;
        width: 100%;
        padding: 4px 8px;
    }

        .form-group-progress-states {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: flex-start;
            align-items: center;
            gap: 10px;
            list-style: none;
        }

            .form-group-progress-state {
                display: block;
                --size: 14px;
                width: var(--size);
                min-width: var(--size);
                max-width: var(--size);
                height: var(--size);
                min-height: var(--size);
                max-height: var(--size);
                border-radius: 666px;
                background: #666;
                transition: .3s;
                cursor: pointer;
                position: relative;
            }
            .form-group-progress-state::after {
                content: '';
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
            }
            .form-group-progress-state.invitation        { background: #006086; }
            .form-group-progress-state.error             { background: #862400; }
            .form-group-progress-state.success           { background: #008621; }
            .form-group-progress-state.readonly          { background: #008664; }

            .form-group-progress-state.invitation::after { content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="%2388CCFF"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>'); }
            .form-group-progress-state.error::after      { content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="%23FFAA88"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>'); }
            .form-group-progress-state.success::after,
            .form-group-progress-state.readonly::after   { content: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="%2388DDAA"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>'); }

        .form-group-progress-track {
            font-size: 20px;
            vertical-align: middle;
        }

            .form-group-progress-track > .ratio {
                color: #444;
                font-size: 16px;
                font-weight: bold;
            }

            .form-group-progress-track > .percent {
                color: #888;
                font-size: 14px;
            }

    .form-group-progress-bar {
        width: 100%;
        height: 8px;
        background: #c7a69a;
        accent-color: #008621;
        transition: .3s;
    }
    .form-group-progress-bar::-webkit-progress-bar {
        background: #c7a69a;
    }
    .form-group-progress-bar::-webkit-progress-value {
        background: #008621;
        border-radius: 7px;
    }

.form-group-name {
    box-sizing: border-box;
    width: 100%;
    padding: 6px 12px;
    border-bottom: 2px solid #000;
    border-radius: 10px 10px 0 0;
    background: #FFF;
    color: #000;
    font-size: 20px;
    font-weight: bold;
    text-align: center;
}

.form-group-name + .form-group-progress {
    border-radius: 0 0 10px 10px;
}

.form-group-content {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: 20px;
    width: 100%;
}

.form-group-meta-field {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 10px;
    box-sizing: border-box;
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    border-left: 3px solid #006086;
    background: #f7fdff;
    box-shadow: 0 1px 4px 0 #666;
    outline: 4px solid transparent;
    outline-offset: 0;
    transition: .3s;
}
    .form-group-meta-field > label {
        color: #000;
        font-size: 18px;
        font-weight: bold;
    }
    .form-group-meta-field > div {
        width: 100%;
    }
</style>
