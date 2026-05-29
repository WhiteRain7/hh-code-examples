<template>
    <div>
        <div class="admin-checkbox">
            <input
                :id="uuid + '-field-' + field.type"
                class="admin-checkbox-input"
                type="checkbox"
                v-model="value"
                @input="$parent.isValid()"/>

            <label
                :for="uuid + '-field-' + field.type"
                class="admin-checkbox-label">

                {{ field.placeholder || field.title || 'подтверждение' }}
            </label>
        </div>
    </div>
</template>


<script>
/**
 * returns {@link boolean}
 *
 * @typedef {Object} field
 *
 * @property {'checkbox'} type
 * @property {boolean} [required=false]
 * @property {string} [placeholder]
 * @property {string} [title]
 */

export default {
    name: 'FormFieldCheckbox',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data () {
        return {
            value: this.field.initial ?? false,
        }
    },

    methods: {
        _settings () {
            return {
                hasState: true,
                hasMessage: this.field.required,
            }
        },

        clear () { this.value = this.field.initial ?? false },
        collectInitial () { return Boolean(this.field.initial) },
        collect () { return Boolean(this.value) },

        isEmpty () { return this.collect() },
        onEmpty: () => 'Галочка должна быть проставлена'
    }
}
</script>


<style scoped>
</style>
