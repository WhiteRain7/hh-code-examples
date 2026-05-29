<template>
    <div>
        <output
            :id="uuid + '-field-' + field.type"
            class="form-field-const"
            v-html="field.placeholder || field.initial">
        </output>
    </div>
</template>


<script>
/**
 * returns field.initial
 *
 * @typedef {Object} field
 *
 * @property {'const'} type
 * @property {string} [placeholder]
 * @property {any} [initial]
 */

// settings
// placeholder: string

// returns
// any initial const

export default {
    name: 'FormFieldText',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data: function () {
        return {
            value: this.field.initial
        }
    },

    methods: {
        _settings () {
            return {
                hasState: false,
                hasMessage: false,
            }
        },

        clear () { this.value = this.field.initial },
        collectInitial () { return this.field.initial },
        collect () { return this.value },

        isValid () { return true },
        isEmpty () { return false },
        onEmpty () { return '' },
    }
}
</script>


<style scoped>
.form-field-const {

}
</style>
