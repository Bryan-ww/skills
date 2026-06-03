export const getNum = (num) => {
    try {
        const [val1, val2] = num.replace('K', '').split("+")
        console.log(val1,val2,'vvvvvvvvvvvv')
        return Number(val1) * 1000 + Number(val2)
    } catch (error) {
        return 0
    }
}

export const getStack = (num) => {
    try {
        return `K${parseInt(num / 1000)}+${num % 1000}`
    } catch (error) {
        return ''
    }
}

