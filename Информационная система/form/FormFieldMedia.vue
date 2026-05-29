<template>
    <div>
        <MediaEditor
            :id="uuid + '-field-' + field.type"
            :media="[]"
            :accepts="field.accepts"
            sortable
            no-sync
            @change="value = $event.media; $parent.isValid()" />
    </div>
</template>


<script>/**
 * returns {@link File}
 *
 * @typedef {Object} field
 *
 * @property {'media'} type
 * @property {string[]} [accepts]
 * @property {number} [minFiles]
 * @property {number} [maxFiles]
 * @property {number} [minSize] - in Kb
 * @property {number} [maxSize] - in Kb
 */
import { plural } from "~/plugins/scripts/utils";

export default {
    name: 'FormFieldFile',

    components: {
        MediaEditor: () => import('~/components/media/MediaEditor')
    },

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data () {
        return {
            value: this.field.initial || []
        }
    },

    methods: {
        clear () { this.value = this.field.initial || [] },
        collectInitial () { return this.field.initial },
        collect () { return this.value },

        isValid () {
            const loaded = this.value.length

            if (this.field.minFiles && loaded < this.field.minFiles) {
                return (
                    `Должно быть загружено от ${this.field.minFiles} до ${this.field.maxFiles} `+
                    `файл${plural(['а','ов','ов'],this.field.maxFiles)}, ` +
                    `сейчас загружено ${loaded}`
                )
            }

            if (this.field.maxFiles && loaded > this.field.maxFiles) {
                return (
                    `Должно быть загружено от ${this.field.minFiles} до ${this.field.maxFiles} `+
                    `файл${plural(['а','ов','ов'],this.field.maxFiles)}, ` +
                    `сейчас отмечено ${loaded}`
                )
            }

            const loadedSize = this.value.reduce((sum, file) => sum + file.size, 0)

            if (this.field.minSize && loadedSize < this.field.minSize) {
                return (
                    `Необходимо загрузить как минимум ${this.field.minSize} Кб, ` +
                    `сейчас суммарный объём файлов составляет ${loadedSize} Кб`
                )
            }

            if (this.field.maxSize && loadedSize > this.field.maxSize) {
                return (
                    `Суммарный объём загруженных файлов не должен превышать ${this.field.maxSize} Кб, `+
                    `сейчас загружено ${loadedSize} Кб`
                )
            }

            return true
        },
        isEmpty () { return !this.value?.length },
        onEmpty: () => 'Вы должны загрузить хотя бы 1 файл'
    }
}
</script>


<style scoped>

</style>
