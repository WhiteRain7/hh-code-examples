<template>
    <div>
        <div v-for="(option, key) in field.options" class="admin-checkbox">
            <input
                :id="uuid + '-field-' + field.type + '-' + key"
                class="admin-checkbox-input"
                type="checkbox"
                :checked="value.includes(key.toString()) ? 'checked' : null"
                @change="toggle(key.toString()); $parent.isValid()"/>

            <label
                :for="uuid + '-field-' + field.type + '-' + key"
                class="admin-checkbox-label">

                {{ option?.name ?? option }}
            </label>
        </div>

        <div v-if="field.controls?.length" class="checkboxes-extra-controls layout-horizontal">
            <template v-if="field.controls.includes('all')">
                <button type="button" class="inline-button bg-option" @click="toggleAll">
                    {{ value.length ? 'Снять все отметки' : 'Выбрать всё' }}
                </button>
            </template>
            <template v-if="field.controls.includes('clear')">
                <button type="button" class="inline-button bg-option" :disabled="value.length === 0" @click="clearAll">
                    Очистить
                </button>
            </template>
            <template v-if="field.controls.includes('invert')">
                <button type="button" class="inline-button bg-option" @click="invert">
                    Инвертировать
                </button>
            </template>
        </div>
    </div>
</template>


<script>
/**
 * returns some of (based on `field.expect`):
 * - `Array<string>`
 * - `Array<T>`
 * - `{ keys: Array<string>, values: Array<T> }`
 *
 * @typedef {Object} field
 *
 * @property {'checkboxes'} type
 * @property {boolean} [required=false]
 * @property {Array<any> | Record<string, any>} options
 * @property {Array<number | string | Object>} [initial]
 * @property {number} [min=0]
 * @property {number} [max]
 * @property {'keys' | 'values' | 'all'} [expect='values']
 * @property {Array<'all' | 'clear' | 'invert'>} [controls=[]]
 */

import { plural } from '~/plugins/scripts/utils'

export default {
    name: 'FormFieldCheckboxes',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data () {
        let value = []

        if (this.field.initial) {
            for (const key in this.field.options) {
                if (
                    this.field.initial.includes(key) ||
                    this.field.initial.includes(this.field.options[key]) ||
                    this.field.initial.includes(this.field.options[key]?.id)
                ) {
                    value.push(key)
                }
            }
        }

        return {
            /** @type {Array<string>} */
            value,

            min: this.field.min || (this.field.required ? 1 : 0),
            max: this.field.max || Object.keys(this.field.options).length,
        }
    },

    methods: {
        clear () {
            let value = []

            if (this.field.initial) {
                for (const key in this.field.options) {
                    if (
                        this.field.initial.includes(key) ||
                        this.field.initial.includes(this.field.options[key]) ||
                        this.field.initial.includes(this.field.options[key]?.id)
                    ) {
                        value.push(key)
                    }
                }
            }
            this.value = value

            this.min = this.field.min || (this.field.required ? 1 : 0)
            this.max = this.field.max || Object.keys(this.field.options).length
        },
        collectInitial () {
            let value = []

            if (this.field.initial) {
                for (const key in this.field.options) {
                    if (
                        this.field.initial.includes(key) ||
                        this.field.initial.includes(this.field.options[key]) ||
                        this.field.initial.includes(this.field.options[key]?.id)
                    ) {
                        value.push(key)
                    }
                }
            }

            switch (this.field.expect) {
                case 'keys':
                    return value
                case 'all':
                    return {
                        keys: value,
                        values: value.map(key => this.field.options[key])
                    }
                case 'values':
                default:
                    return value.map(key => this.field.options[key])
            }
        },
        collect () {
            switch (this.field.expect) {
                case 'keys':
                    return this.value
                case 'all':
                    return {
                        keys: this.value,
                        values: this.value.map(key => this.field.options[key])
                    }
                case 'values':
                default:
                    return this.value.map(key => this.field.options[key])
            }
        },


        isValid () {
            const checked = this.value.length

            if (this.min && checked < this.min) {
                return (
                    `Должно быть отмечено от ${this.min} до ${this.max} `+
                    `пункт${plural(['','а','ов'],this.max)}, ` +
                    `но отмечено ${checked}`
                )
            }

            if (this.max && checked > this.max) {
                return (
                    `Должно быть отмечено от ${this.min} до ${this.max} `+
                    `пункт${plural(['','а','ов'],this.max)}, ` +
                    `но отмечено ${checked}`
                )
            }

            return true
        },
        isEmpty () { return !this.value.some(v => v) },
        onEmpty: () => 'Хотя бы один пункт должен быть отмечен',

        toggle (key) {
            if (this.value.includes(key)) {
                this.value = this.value.filter(v => v !== key)
            } else {
                this.value.push(key)
            }
        },


        toggleAll () {
            if (this.value.length) {
                this.value = []
            }
            else {
                this.value = Object.keys(this.field.options)
            }
        },

        clearAll () {
            this.value = []
        },

        invert () {
            this.value = Object.keys(this.field.options).filter(key => !this.value.includes(key))
        },
    }
}
</script>


<style scoped>
.checkboxes-extra-controls { margin-top: 10px; }
</style>
