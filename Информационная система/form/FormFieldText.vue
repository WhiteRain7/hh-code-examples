<template>
    <div>
        <input
            :id="uuid + '-field-' + field.type"
            class="admin-input"
            type="text"
            v-model="value"
            :list="uuid + '-datalist'"
            :placeholder="field.placeholder"
            :title="field.placeholder"
            @input="$parent.isValid()" />

        <datalist v-if="field.suggestions" :id="uuid + '-datalist'">
            <option v-for="suggestion in field.suggestions" :key="suggestion">{{ suggestion }}</option>
        </datalist>
    </div>
</template>


<script>/**
 * returns {@link string}
 *
 * @typedef {Object} field
 *
 * @property {'slider'} type
 * @property {string} [placeholder]
 * @property {string} [initial]
 * @property {string[]} [suggestions] - suggestions displayed as datalist
 * @property {string[]} [reserved] - whole values that may not be entered
 * @property {string} [allowed] - chars that may be entered (all if not specified)
 * @property {string} [denied] - chars that may not be entered (takes precedence over allowed)
 * @property {number} [maxlength] - max length
 * @property {number} [minlength] - min length
 * @property {RegExp} [pattern] - regular expression that must be matched (use placeholder or patternHint as hint for user)
 * @property {string} [patternHint] - human-readable pattern for user showed as hint if mismatching regex
 */

import { plural } from "~/plugins/scripts/utils";

export default {
    name: 'FormFieldText',

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
            if (this.field.reserved && this.field.reserved.map(v => v.toLowerCase()).includes(this.value.toLowerCase())) {
                return 'Это значение недоступно или зарезервировано, попробуйте другое'
            }

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

            if (this.field.pattern && !this.field.pattern.test(this.value)) {
                if (this.field.patternHint) return `Значение должно соответствовать шаблону «${this.field.patternHint}»`
                return `Значение должно соответствовать шаблону`
            }

            return true
        },
        isEmpty () { return !this.value },
        onEmpty: () => 'Поле не должно быть пустым'
    }
}
</script>


<style scoped>

</style>
