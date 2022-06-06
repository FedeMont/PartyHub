$.ajaxSetup({
    beforeSend: (jqXHR, settings) => { settings.url = "http://localhost:3000" + settings.url },
    contentType: "application/x-www-form-urlencoded",
    headers: {
        "Authorization": "Bearer " + readCookie("token")
    },
    dataType: 'json',
});

function readCookie(name) {
    let nameEQ = encodeURIComponent(name) + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function createCookie(name, value, days) {
    let expires;
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; SameSite=Lax; path=/";
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

let topBar = (title, rightContent = undefined, shouldShearch = false, topContent = undefined) => {
    console.log(topContent);
    return `
    <div class="col s12 grey lighten-4 top_tab" style="padding-bottom: 20px">
        <div class="container" style="margin-top: 1.4rem">
            <div class="row m-0">
                ${topContent?? ""}
            </div>
            <div class="row m-0 valign-wrapper">
                <div class="col s9">
                    <h4 class="left m-0" id="top-bar-title" style="font-weight: bold">${title}</h4>
                </div>
<!--                <div class="col s8"></div>-->
                <div class="col s3 valign-wrapper right">
                    ${rightContent?? ""}
                </div>
            </div>
        </div>
    </div>

    <div class="col s12 grey lighten-4">
        <div class="container">
            <div class="section"></div>
            <div class="section"></div>
            <div class="section"></div>
            ${(shouldShearch) ?
            `
                    <nav class="grey lighten-2">
                        <div class="nav-wrapper">
                            <form id="party_search">
                                <div class="input-field">
                                    <input id="search" type="search">
                                    <label class="label-icon" for="search"><i class="material-icons">search</i></label>
                                </div>
                            </form>
                        </div>
                    </nav>
                ` : ""
        }
            <div class="section" style="height: 10px; padding-bottom: 0.1rem;"></div>
        </div>
    </div>
    `;
};

let utentePartecipanteBottomBar = () => {
    return `
        <div class="col s12 navigation_tabs">
            <ul class="tabs tabs-fixed-width tabs-icon">
                <li class="tab col s3">
                    <a target="_self" href="/utente/" id="0">
                        <i class="material-icons">home</i>
                        Home
                    </a>
                </li>
                <li class="tab col s3">
                    <a target="_self" href="/utente/lista_biglietti" id="1">
                        <i class="material-icons">confirmation_number</i>
                        Biglietti
                    </a>
                </li>
                <li class="tab col s3">
                    <a target="_self" href="../../TODO" id="2">
                        <i class="material-icons">group</i>
                        Friends
                    </a>
                </li>
                <li class="tab col s3">
                    <a target="_self" href="/utente/storico_eventi" id="3">
                        <i class="material-icons">bookmark</i>
                        Eventi
                    </a>
                </li>
            </ul>
        </div>
    `;
};

let dipendenteBottomBar = () => {
    return `
        <div class="col s12 navigation_tabs">
            <ul class="tabs tabs-fixed-width tabs-icon">
                <li class="tab col s3">
                    <a target="_self" href="/dipendente/settings" id="0">
                        <i class="material-icons">settings</i>
                        Impostazioni
                    </a>
                </li>
                <li class="tab col s3">
                    <a target="_self" href="/dipendente/" id="1">
                        <i class="material-icons">list</i>
                        Prodotti
                    </a>
                </li>
            </ul>
        </div>
    `;
};

let organizzatoreBottomBar = () => {
    return `
    <div class="col s12 navigation_tabs">
        <ul class="tabs tabs-fixed-width tabs-icon">
            <li class="tab col s3 ph-0">
                <a target="_self" href="/organizzatore/settings" id="0">
                    <i class="material-icons">settings</i>
                    Impostazioni
                </a>
            </li>
            <li class="tab col s3 ph-0">
                <a target="_self" href="/organizzatore/" id="1">
                    <i class="material-icons">list</i>
                    Servizi
                </a>
            </li>
            <li class="tab col s3 ph-0">
                <a target="_self" href="/organizzatore/lista_dipendenti" id="2">
                    <i class="material-icons">group</i>
                    Dipendenti
                </a>
            </li>
            <li class="tab col s3 ph-0">
                <a target="_self" href="/organizzatore/storico_eventi" id="3">
                    <i class="material-icons">bookmark</i>
                    Events
                </a>
            </li>
        </ul>
    </div>
    `;
};

function addBottomBar(user_type, tab) {
    switch (user_type) {
        case "up":
            $("#bottom_bar").append(utentePartecipanteBottomBar());
            break;
        case "d":
            $("#bottom_bar").append(dipendenteBottomBar());
            break;
        case "o":
            $("#bottom_bar").append(organizzatoreBottomBar());
            break;
    }

    $("#" + tab).addClass("active");
    $('.tabs').tabs({ "duration": 0 });
}

function addTopBar(title, rightContent = undefined, shouldShearch = false, topContent = undefined) {
    $("#top_bar").html(topBar(title, rightContent, shouldShearch, topContent));
}

$(window).on("load", () => {
    if (window.location.pathname !== "/login/" && window.location.pathname !== "/signin/" && window.location.pathname !== "/recupera_password/") {
        $.ajax({
            url: "/api/auth/validate_token",
            type: "GET",
            data: {},
            success: (data) => {
                console.log(data);
                switch (data.message) {
                    case "up":
                        if (window.location.pathname.split('/')[1] !== "utente") window.location.replace("/utente/");
                        break;
                    case "d":
                        if (window.location.pathname.split('/')[1] !== "dipendente") window.location.replace("/dipendente/");
                        break;
                    case "o":
                        if (window.location.pathname.split('/')[1] !== "organizzatore") window.location.replace("/organizzatore/");
                        break;
                }
            },
            error: (data) => {
                console.log(data);
                window.location.replace("/login");
            }
        });
    }
});

$(document).ready(() => {
    M.updateTextFields();
    $('select').formSelect();
});

$("#logout_btn").click(() => {
    console.log("Logout");
    if (confirm("Sei sicuro di voler uscire?")) {
        $.ajax({
            url: "/api/auth/logout",
            type: "POST",
            data: {},
            success: (data) => {
                console.log(data);
                eraseCookie("token");
                window.location.replace("/login");
            }, error: (data) => {
                console.log(data);
                M.toast({ html: data.responseJSON.message });
            }
        });
    }
});