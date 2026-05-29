## Описание

Набор компонентов, которые образуют вызываемое модальное окно с формой. Форма поддерживает 18 типов полей с настройками, группы полей и пр.

## Файлы

- *FormContainer* - основной компонент модальной формы.
- *FormGroup* - раздел (заполнив один раздел, пользователь может перейти к следующей, примерно как в Google Forms).
- *FormField* - поле формы, обёртка для типов полей.
- *FormField\** - тип поля, который реализует основную функцию ввода.

## Примеры

Пример вызова формы с 3 полями: год аудита, название аудита и комментарий к аудиту

```js
const result1 = await form.ask({
    year: {
        type: 'number',
        name: 'Год аудита',
        placeholder: 'год',
        reserved: this.audits.map(a => a.year), // нельзя ввести год, который уже был
        required: true
    },

    name: {
        type: 'text',
        name: 'Название аудита',
        placeholder: 'необязательно',
    },

    comment: {
        type: 'multiline',
        name: 'Комментарий к аудиту',
        placeholder: 'необязательно',
    }
})

if (!result1) { // Если форма была закрыта без заполнения, возвращается null
    return null
}

console.log(result1.year)
console.log(result1.name)
console.log(result1.comment)
```

Пример окна настроек действия.

```js
const result2 = await form.ask({
        takeSum: {
            type: 'checkbox',
            name: 'Хотите ли вы взять итоговую сумму таблицы как общую сумму финансирования?',
            placeholder: 'да',
            initial: true, // значение по умолчанию
        },
        clearTable: {
            type: 'checkbox',
            name: 'Хотите ли вы очистить таблицу?',
            description: 'Если нет, таблица будет сохранена и позже вы сможете к ней вернуться.',
            placeholder: 'да',
            initial: false, // значение по умолчанию
        }
    },
    { size: 'normal', end: 'Заменить' }, // Настройки формы - размер и текст кнопки "отправить"
)
if (!result) {
    return null
}

if (result.takeSum) {
    this.value.amount = this.fundingSum()
}
if (result.clearTable) {
    this.funding = {}
    this.fundingYears = []
    this.fundingSources = []
}
```

Форме можно указать группы полей

```js
const result3 = await this.$layer.ask([
    {
        fields: {
            photo: {
                type: 'file',
                name: 'Фото',
                description: 'Если не указано, будет использована иконка направления.',
                accept: 'images',
                required: false
            },
            name: {
                type: 'text',
                name: 'Название события',
                description: 'Только буквы кириллического алфавита и цифры',
                placeholder: 'Введите название',
                denied: 'a-zA-Z', // Запрещённые символы (RegExp)
                required: true,
                remember: true // Заполненное поле будет отображаться во всех последующих группах полей, чтобы пользователь мог посмотреть название не возвращаясь назад
            },
            venue: {
                type: 'text',
                name: 'Место проведения',
                placeholder: 'Укажите адрес',
                required: true
            },
            startedAtDate: {
                type: 'date',
                name: 'Дата начала',
                required: true,
                initial: this.$refs.view.value,
            },
            startedAtTime: {
                type: 'time',
                name: 'Время начала',
                required: false,
            },
        }
    },
    {
        fields: {
            territory: {
                type: 'select',
                name: 'Территория',
                description: 'После этого вам предложат выбрать направление',
                placeholder: 'Выберите территорию',
                required: true,
                options: this.$store.state.ini.territories,
                remember: true
            },
            description: {
                type: 'multiline',
                name: 'Описание',
                description: 'Только буквы кириллического алфавита и цифры',
                placeholder: 'Опишите событие',
                denied: 'a-zA-Z',
                required: true
            },
        },
        // Группы также можно создавать динамически (для ветвления, или, в данном случае, для запроса значений, которые зависимы от прошлых ответов)
        onNext: async (context) => {
            const directions = await getDirectionsOf(context.values.territory.id)

            return {
                fields: {
                    directionOnTerritory: {
                        type: 'select',
                        name: 'Направление',
                        placeholder: 'Выберите направление',
                        required: true,
                        options: directions
                    },
                },
                next: 'Создать' // Текст кнопки "далее" (в данном случае - кнопка отправки)
            }
        }
    }
])

// Возвращаемый объект с ответами идёт без глубины по группам
result3.name
result3.territory
result3.directionOnTerritory
```