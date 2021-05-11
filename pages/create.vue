<template>
  <div class="container">
    <div>
      <Logo />
      <h1 class="title">Create a coin</h1>
      <div id="result"></div>
      <form id="coins-form" role="form" type="POST">
        <div class="form-group">
          <label>Date: (not required)</label
          ><input
            class="form-control"
            name="date"
            data-type="datetime"
            type="date"
          />
        </div>
        <div class="form-group">
          <label>Value: </label
          ><input
            class="form-control"
            name="value"
            data-type="money"
            type="text"
            pattern="[0-9.]+"
            required
          />
        </div>
        <div class="form-group">
          <label>Pin: </label
          ><input
            class="form-control"
            name="pin"
            data-type="text"
            type="text"
          />
        </div>
        <div class="form-group">
          <label>Password: </label
          ><input
            class="form-control"
            name="password"
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
        <NuxtLink to="/" class="button--grey back-button"> Back </NuxtLink>
      </form>
    </div>
  </div>
</template>

<script>
// Import Bootstrap an BootstrapVue CSS files (order is important)coins
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'jquery-datetimepicker/build/jquery.datetimepicker.min.css'

import jQuery from 'jquery'
import Password from '../src/password.ts'
import 'jquery-datetimepicker'
import 'jquery-serializejson'

export default {
  mounted() {
    jQuery(function ($) {
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

      $.datetimepicker.setLocale('en')
      $('input[data-type=date]')
        .datetimepicker({ timepicker: false, format: 'Y/m/d' })
        .attr('type', 'text')

      const apikey = process.env.REST_API_CODE

      const ajaxSettings = {
        async: true,
        crossDomain: true,
        url: process.env.REST_API_URL,
        method: 'POST',
        headers: {
          'x-apikey': apikey,
          'content-type': 'application/json',
        },
        processData: false,
      }

      function create(formObj, hashes) {
        formObj.password = hashes[0]
        formObj.pin = hashes[1]
        ajaxSettings.data = JSON.stringify(formObj)
        ajaxSettings.method = 'POST'
        $.ajax(ajaxSettings)
          .done(function () {
            $('#result').replaceWith(
              $('<div class="alert alert-success">').text('Success')
            )
            reset()
          })
          .fail(function (response) {
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
              reset()
            } else {
              let msg
              // eslint-disable-next-line prefer-const
              msg =
                ajaxSettings.headers['x-apikey'] &&
                ajaxSettings.headers['x-apikey'].length < 24
                  ? 'Missing API-key'
                  : 'Server Error'
              alert(msg)
            }
          })
      }

      function postForm() {
        $('#coins-form .has-error').removeClass('has-error')
        $('#coins-form .help-block').remove()

        $('#btn-submit').prop('disabled', true).text('Loading...')

        $('input[data-type=datetime],input[data-type=datetime-local]').each(
          function () {
            const theDate = $(this).val()
            if (theDate) {
              $(this).val(new Date(theDate).toISOString())
            }
          }
        )

        // get the form data
        const formObj = $('#coins-form').serializeJSON()
        const value = formObj.pin

        const p = []
        p.push(
          password.encrypt(
            JSON.stringify(formObj),
            formObj.password,
            process.env.PASSWORD_ITERATIONS
          )
        )
        p.push(password.encrypt(formObj.pin, value, process.env.PIN_ITERATIONS))

        Promise.all(p).then(function (hashes) {
          ajaxSettings.method = 'GET'
          $.ajax(ajaxSettings).done(function (response) {
            response = response
              .map(function (line) {
                return line.pin === hashes[1]
              })
              .filter((line) => line)
            if (response.length) {
              $('#result').replaceWith(
                $('<div class="alert alert-light">').text('Pin already exits')
              )
              reset()
            } else {
              create(formObj, hashes)
            }
          })
        })
      }

      function reset() {
        $('#btn-submit').text('Submit').prop('disabled', false)
        document.getElementById('coins-form').reset()
      }

      $('#coins-form').submit(function (event) {
        postForm()
        event.preventDefault()
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

#btn-submit,
.back-button {
  width: 300px;
  display: block;
  margin: 20px auto 0 auto;
}
</style>
