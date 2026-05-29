<template>
    <div>
        <FileInput
            :id="uuid + '-field-' + field.type"
            :accept="field.accept"
            @change="value = $event; $parent.isValid()"
            :title="field.placeholder" />
    </div>
</template>


<script>
/**
 * returns {@link File}
 *
 * @typedef {Object} field
 *
 * @property {'file'} type
 * @property {string}  accept
 * @property {string} [placeholder]
 */

export default {
    name: 'FormFieldFile',

    components: {
        FileInput: () => import('~/components/controls/FileInput')
    },

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data () {
        return {
            value: this.field.initial || null
        }
    },

    methods: {
        clear () { this.value = this.field.initial || null },
        collectInitial () { return this.field.initial },
        collect () { return this.value },

        isValid () {
            return true
        },
        isEmpty () { return !this.value },
        onEmpty: () => 'Вы должны загрузить файл'
    }
}
</script>


<style scoped>

</style>
