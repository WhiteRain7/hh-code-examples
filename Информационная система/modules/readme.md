## Описание

Некоторые глобально подключаемые модули.

## Файлы

### saving

Модуль, позволяющий реализовать автосохранение полей. Вместе с ним идут несколько Vue директив.

Модуль отслеживает изменнёные поля и если изменения не поступали 1 секунду (debounce) - только тогда провоцирует callback сохранения с передачей названий изменённых полей.

Помимо отслеживания, модуль сам выводит уведомления о сохранении, а также предупреждает пользователя, если тот пытается покинуть страницу во время идущего сохранения.

```html
<!-- отметить изменение поля name в группу изменений main -->
<input v-model="facility.name" v-autosave:name="'main'" />

<!-- отметить изменение поля facilityType в группу изменений main -->
<input
    type="radio"
    :value="facilityType"
    :checked="facility.facilityType?.id === facilityType.id"
    @change="facility.facilityType = facilityType"
    v-autosave:facilityType="'main'"/>

<!-- провоцировать сохранение на событие input вместо change -->
<input v-model="facility.address" v-exp-autosave:address.input="'main'"/>

<!-- отметить изменение поля name в группу изменений concern с индексом изменяемого объекта -->
<input v-model="concern.name" v-exp-autosave:name="[ 'concern', index ]"/>
```

```js
// Добавить прослушивание группы main, в функцию передаётся затронутый объект, если есть (index) и Set названий изменённых полей
this.$saving.bind('concern', (affected, fields) => this.saveMain(affected, fields))

// Обернуть методы, чтобы модуль добавлял уведомления об идущем/законченном/провалившемся сохранении при вызове этих методов.
this.$saving.wrap(this, 'createDuplicate')
```