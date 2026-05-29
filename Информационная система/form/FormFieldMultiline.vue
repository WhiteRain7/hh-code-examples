<template>
    <div>
        <textarea
            :id="uuid + '-field-' + field.type"
            class="admin-input"
            v-model="value"
            :placeholder="field.placeholder"
            :title="field.placeholder"
            @input="$parent.isValid()">
        </textarea>
    </div>
</template>


<script>
/**
 * returns {@link string}
 *
 * @typedef {Object} field
 *
 * @property {'multiline'} type
 * @property {string} [placeholder]
 * @property {string} [initial]
 * @property {string} [allowed] - chars that may be entered (all if not specified)
 * @property {string} [denied] - chars that may not be entered (takes precedence over allowed)
 * @property {number} [maxlength] - max length
 * @property {number} [minlength] - min length
 */

import { plural } from '~/plugins/scripts/utils'

export default {
    name: 'FormFieldMultiline',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data () {
        return {
            value: this.field.initial || ''
        }
    },

    methods: {
        clear () { this.value = this.field.initial || '' },
        collectInitial () { return this.field.initial },
        collect () { return this.value },

        isValid () {
            if (this.field.minlength && this.value.length < this.field.minlength) {
                return `Минимум ${this.field.minlength} символ${plural(['','а','ов'], this.field.minlength)}`
            }

            if (this.field.maxlength && this.value.length > this.field.maxlength) {
                return (
                    `Значение должно содержать не более ${this.field.maxlength} ` +
                    `символ${plural(['а','ов','ов'], this.field.maxlength)}`
                )
            }

            if (this.field.allowed) {
                const matched = this.value.match(new RegExp(`[^${this.field.allowed}]`))

                if (matched) {
                    return `Символ «${matched[0]}» недопустим здесь`
                }
            }

            if (this.field.denied) {
                const matched = this.value.match(new RegExp(`[${this.field.denied}]`))

                if (matched) {
                    return `Символ «${matched[0]}» недопустим здесь`
                }
            }

            return true
        },
        isEmpty () { return !this.value },
        onEmpty: () => 'Поле не должно быть пустым'
    }
}
</script>


<style scoped>
textarea.admin-input {
    min-height: 60px;
    max-height: 300px;
}
</style>
