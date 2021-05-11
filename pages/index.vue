<template>
  <div class="container">
    <div>
      <Logo />
      <h1 class="title">greencoin</h1>
      <div id="result"></div>
      <form id="coins-form" role="form" type="POST">
        <div class="form-group">
          <label for="value">Pin: </label
          ><input
            id="value"
            class="form-control"
            name="value"
            data-type="text"
            type="text"
          />
        </div>
        <div id="fg-errors" class="form-group"></div>
        <button
          id="btn-submit"
          class="btn btn-primary btn-lg"
          type="submit"
          data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Submitting..."
        >
          Submit
        </button>
      </form>
      <div class="links">
        <NuxtLink to="/create" class="button--grey"> Create </NuxtLink>
        <a
          href="https://github.com/hlohaus/greencoin"
          target="_blank"
          rel="noopener noreferrer"
          class="button--grey"
        >
          GitHub
        </a>
      </div>
    </div>
  </div>
</template>

<script>
// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import jQuery from 'jquery'
import Password from '../src/password'
import 'jquery-serializejson'

export default {
  mounted() {
    jQuery(function ($) {
      // put your own error messages and/or message translation logic here
      const errorMessages = {
        REQUIRED: 'This field is required',
        UNIQUE: 'This value already exists',
        TYPE: 'Invalid data type',
        REGEX: 'Invalid data format',
        number: 'Must be an integer number',
        money: 'Must be a number with max two decimals',
        JSON: 'Not a valid JSON',
        float_number: 'Must be a decimal number',
        email: 'Must be a valid email',
        FILESIZE: 'Upload exceeds file size limit per field (max 1 MB)',
        UPLOADERROR: 'Unable to upload file, please try again',
        GENERIC_ERROR: 'A server error occured, please reload page',
      }

      const password = new Password()

      const ajaxSettings = {
        async: true,
        crossDomain: true,
        url: process.env.REST_API_URL,
        headers: {
          'x-apikey': process.env.REST_API_CODE,
          'content-type': 'application/json',
        },
        processData: false,
      }

      const onFail = function (response) {
        $('#btn-submit').text('Submit')
        const error = response.responseJSON
        if (error && error.name === 'ValidationError') {
          $.each(error.list, function (fielderr) {
            const inputSelector = '[name=' + fielderr.field + ']'
            const errorMessageCode = fielderr.message[1]
            let errorMessage =
              errorMessages[errorMessageCode] || 'Invalid value'
            if (errorMessageCode === 'TYPE') {
              const fieldType = $(inputSelector).data('type')
              errorMessage = errorMessages[fieldType] || 'Invalid value'
            }
            $(inputSelector).after(
              "<div class='help-block'>" + errorMessage + '</div>'
            )
            $(inputSelector).parents('.form-group').addClass('has-error')
          })
        } else {
          let msg
          // eslint-disable-next-line prefer-const
          msg =
            ajaxSettings.headers['x-apikey'] &&
            ajaxSettings.headers['x-apapikeyikey'].length < 24
              ? 'Missing API-key'
              : 'Server Error'
          alert(msg)
        }
      }

      let coin = null
      const resultContainer = $('#result')

      function postForm() {
        // clear errors
        $('#coins-form .has-error').removeClass('has-error')
        $('#coins-form .help-block').remove()
        $('#result').empty()

        $('#btn-submit').prop('disabled', true).text('Loading...')
        const pin = $('#value').val()
        ajaxSettings.method = 'GET'
        $.ajax(ajaxSettings)
          .done(function (response) {
            const results = []
            response.forEach(function (line) {
              results.push(
                password
                  .decrypt(line.pin, pin, process.env.PIN_ITERATIONS)
                  .then(function () {
                    return line
                  })
                  .catch((error) => console.log(error))
              )
            })
            Promise.all(results).then(function (values) {
              const results = []
              values = values.filter((line) => line)
              if (values.length < 1) {
                $('#result').replaceWith('<b>Not found</b>')
                reset()
              } else {
                values.forEach(function (line) {
                  if (line.delete) {
                    results.push(
                      password
                        .decrypt(
                          line.password,
                          line.delete,
                          process.env.PASSWORD_ITERATIONS
                        )
                        .then(function () {
                          return true
                        })
                        .catch((error) => console.log(error))
                    )
                  }
                })
                Promise.all(results).then(function (deletes) {
                  deletes = deletes.filter((line) => line)
                  if (deletes.length) {
                    resultContainer.append(
                      $('<p>').append($('<b>').text('Is deleted'))
                    )
                    show(values.shift())
                    reset()
                  } else {
                    resultContainer.append(
                      $('<p>').append($('<b>').text('Is open'))
                    )
                    if (!coin) {
                      coin = values.shift()
                      show(coin)
                      $('#btn-submit').prop('disabled', false).text('Delete')
                      $('[for="value"]').text('Password')
                    }
                  }
                })
              }
            })
          })
          .fail(onFail)
      }

      function show(coin) {
        resultContainer.append($('<p>').text('Value: ' + coin.value))
        if (coin.date) {
          resultContainer.append($('<p>').text('Date: ' + coin.date))
        }
      }

      function reset() {
        $('[for="value"]').text('Pin')
        $('#btn-submit').prop('disabled', false).text('Submit')
        $('#value').val('')
        coin = null
      }

      function deleteCoin() {
        const value = $('#value').val()
        password
          .decrypt(coin.password, value, process.env.PASSWORD_ITERATIONS)
          .then(function (result) {
            if (result) {
              delete coin._id
              coin.delete = value
              ajaxSettings.data = JSON.stringify(coin)
              ajaxSettings.method = 'POST'
              $.ajax(ajaxSettings)
                .done(function () {
                  resultContainer.replaceWith(
                    $('<p>').append($('<b>').text('Deleted'))
                  )
                  reset()
                })
                .fail(onFail)
            }
          })
          .catch((error) => {
            console.log(error)
            resultContainer.replaceWith(
              $('<p>').append($('<b>').text('Failed!'))
            )
            reset()
          })
      }

      $('#coins-form').submit(function (event) {
        event.preventDefault()
        if (coin) {
          deleteCoin()
          return false
        }
        postForm()
        return false
      })
    })
  },
}
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

#coins-form {
  padding: 10px;
}

#coins-form input,
#coins-form select {
  width: 300px;
  display: inline-block;
}

label {
  display: block;
}

.form-control {
  width: auto;
}

.help-block {
  margin-left: 10px;
}

#btn-submit {
  width: 300px;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 80px;
  color: #35495e;
  letter-spacing: 1px;
}

.links {
  padding-top: 15px;
}
</style>
