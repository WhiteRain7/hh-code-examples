<template>
    <div>
        <input
            :id="uuid + '-field-' + field.type"
            class="admin-input"
            type="text"
            v-model="value"
            :placeholder="field.placeholder || '0,000 0,000'"
            :title="field.placeholder"
            @input="$parent.isValid()" />
    </div>
</template>


<script>
// settings
// - placeholder: string - placeholder

// returns
// string

/**
 * returns {@link GeoJSON}
 *
 * @typedef {Object} field
 *
 * @property {'coords'} type
 * @property {string} [placeholder]
 * @property {string} [initial]
 */

import { formatCoordinates, parseCoordinates, isValidLatitude, isValidLongitude } from '~/plugins/scripts/utils'
import { GeoJSON } from '~/plugins/scripts/classes'

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
        collectInitial () { return GeoJSON.from(this.field.initial || '0 0') },
        collect () { return GeoJSON.from(this.value || '0 0') },

        isValid () {
            let value = this.value.trim()

            const matched = value.match(/^(-?\d+[,.]?\d*)[;, ]\s*(-?\d+[,.]?\d*)$/)

            if (!matched) {
                if (value.match(/[^0-9;,. -]/)) return 'Формат не подразумевает символы кроме цифр, запятых (или точек) и знака минус'
                if (value.match(/^(-?\d+[,.]?\d*)$/)) {
                    if (!isValidLatitude(value.match(/^(-?\d+[,.]?\d*)$/)[1])) return 'Широта должна быть в пределах от -90 до 90'
                    return 'Не хватает долготы'
                }
                if (value.split(' ').length !== 2) return 'Должен быть только один пробел - между координатами'

                return 'Координаты не удовлетворяют шаблону'
            }

            else {
                const coords = parseCoordinates(value)
                if (coords?.longitude == 0 && coords?.latitude == 0) return 'Введите не нулевые координаты'
                if (coords?.longitude) return true

                const [ _, latitudeStr, longitudeStr ] = matched

                const parse = str => parseFloat(str.replace(',', '.'))

                const latitude = parse(latitudeStr)
                const longitude = parse(longitudeStr)

                if (!isValidLatitude(latitude)) return 'Широта должна быть первым числом и лежать в пределах от -90 до 90'
                if (!isValidLongitude(longitude)) return 'Долгота должна быть вторым числом и лежать в пределах от -180 до 180'
                return 'Некорректные координаты'
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
